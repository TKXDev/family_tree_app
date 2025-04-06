import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import FamilyMember from "@/models/FamilyMember";
import Relationship from "@/models/Relationship";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createCanvas } from "canvas";

interface ExportData {
  members: any[];
  relationships: any[];
  metadata: {
    exportDate: string;
    totalMembers: number;
    totalRelationships: number;
    generations: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication using token from cookies
    const token = req.cookies.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    if (!format || !["json", "pdf", "png"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format specified" },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch all family members and relationships
    const familyMembers = await FamilyMember.find({});
    const relationships = await Relationship.find({});

    // Calculate metadata
    const generations = [...new Set(familyMembers.map((m) => m.generation))]
      .length;

    const exportData: ExportData = {
      members: familyMembers,
      relationships: relationships,
      metadata: {
        exportDate: new Date().toISOString(),
        totalMembers: familyMembers.length,
        totalRelationships: relationships.length,
        generations: generations,
      },
    };

    // Create metadata text array
    const metadataText = [
      `Export Date: ${new Date().toLocaleString()}`,
      `Total Members: ${exportData.metadata.totalMembers}`,
      `Total Relationships: ${exportData.metadata.totalRelationships}`,
      `Number of Generations: ${exportData.metadata.generations}`,
    ];

    switch (format) {
      case "json":
        return NextResponse.json(exportData, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="family-tree.json"',
          },
        });

      case "pdf":
        try {
          const pdfDoc = await PDFDocument.create();
          const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const helveticaBold = await pdfDoc.embedFont(
            StandardFonts.HelveticaBold
          );
          let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
          const { width, height } = page.getSize();

          // Add title and metadata
          page.drawText("Family Tree Export", {
            x: 50,
            y: height - 50,
            size: 24,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });

          // Add metadata section
          let y = height - 100;
          page.drawText("Export Information:", {
            x: 50,
            y,
            size: 14,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
          y -= 25;

          metadataText.forEach((text) => {
            page.drawText(text, {
              x: 50,
              y,
              size: 12,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
            y -= 20;
          });

          // Add members section
          y -= 20;
          page.drawText("Family Members:", {
            x: 50,
            y,
            size: 14,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          });
          y -= 25;

          familyMembers.forEach((member) => {
            const memberText = `${member.first_name} ${member.last_name}`;
            const detailsText = `Birth: ${new Date(
              member.birth_date
            ).toLocaleDateString()}${
              member.death_date
                ? ` - Death: ${new Date(
                    member.death_date
                  ).toLocaleDateString()}`
                : ""
            } | Gender: ${member.gender} | Generation: ${member.generation}`;

            page.drawText(memberText, {
              x: 50,
              y,
              size: 12,
              font: helveticaBold,
              color: rgb(0, 0, 0),
            });
            y -= 20;

            page.drawText(detailsText, {
              x: 70,
              y,
              size: 10,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
            y -= 25;

            // Add relationships
            const memberRelationships = relationships.filter(
              (r) => r.member1Id === member._id || r.member2Id === member._id
            );
            if (memberRelationships.length > 0) {
              memberRelationships.forEach((rel) => {
                const otherMember = familyMembers.find(
                  (m) =>
                    m._id ===
                    (rel.member1Id === member._id
                      ? rel.member2Id
                      : rel.member1Id)
                );
                if (otherMember) {
                  page.drawText(
                    `${rel.type}: ${otherMember.first_name} ${otherMember.last_name}`,
                    {
                      x: 90,
                      y,
                      size: 10,
                      font: helveticaFont,
                      color: rgb(0, 0, 0),
                    }
                  );
                  y -= 20;
                }
              });
            }

            // Add new page if needed
            if (y < 50) {
              page = pdfDoc.addPage([595.28, 841.89]);
              y = height - 50;
            }
          });

          const pdfBytes = await pdfDoc.save();
          return new NextResponse(pdfBytes, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'attachment; filename="family-tree.pdf"',
            },
          });
        } catch (pdfError: any) {
          console.error("PDF generation error:", pdfError);
          return NextResponse.json(
            { error: "Failed to generate PDF", details: pdfError.message },
            { status: 500 }
          );
        }

      case "png":
        try {
          const canvas = createCanvas(1200, 800);
          const ctx = canvas.getContext("2d");

          // Set background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, 1200, 800);

          // Add title
          ctx.font = "bold 24px Arial";
          ctx.fillStyle = "black";
          ctx.fillText("Family Tree Export", 50, 50);

          // Add metadata
          ctx.font = "bold 14px Arial";
          let yPos = 100;
          ctx.fillText("Export Information:", 50, yPos);
          yPos += 25;

          ctx.font = "12px Arial";
          metadataText.forEach((text) => {
            ctx.fillText(text, 50, yPos);
            yPos += 20;
          });

          // Add members
          yPos += 20;
          ctx.font = "bold 14px Arial";
          ctx.fillText("Family Members:", 50, yPos);
          yPos += 25;

          ctx.font = "12px Arial";
          familyMembers.forEach((member) => {
            const memberText = `${member.first_name} ${member.last_name}`;
            const detailsText = `Birth: ${new Date(
              member.birth_date
            ).toLocaleDateString()}${
              member.death_date
                ? ` - Death: ${new Date(
                    member.death_date
                  ).toLocaleDateString()}`
                : ""
            } | Gender: ${member.gender} | Generation: ${member.generation}`;

            ctx.font = "bold 12px Arial";
            ctx.fillText(memberText, 50, yPos);
            yPos += 20;

            ctx.font = "12px Arial";
            ctx.fillText(detailsText, 70, yPos);
            yPos += 25;

            // Add relationships
            const memberRelationships = relationships.filter(
              (r) => r.member1Id === member._id || r.member2Id === member._id
            );
            if (memberRelationships.length > 0) {
              ctx.font = "italic 12px Arial";
              memberRelationships.forEach((rel) => {
                const otherMember = familyMembers.find(
                  (m) =>
                    m._id ===
                    (rel.member1Id === member._id
                      ? rel.member2Id
                      : rel.member1Id)
                );
                if (otherMember) {
                  ctx.fillText(
                    `${rel.type}: ${otherMember.first_name} ${otherMember.last_name}`,
                    90,
                    yPos
                  );
                  yPos += 20;
                }
              });
            }
          });

          const pngBuffer = canvas.toBuffer("image/png");
          return new NextResponse(pngBuffer, {
            headers: {
              "Content-Type": "image/png",
              "Content-Disposition": 'attachment; filename="family-tree.png"',
            },
          });
        } catch (pngError: any) {
          console.error("PNG generation error:", pngError);
          // Fallback to JSON if PNG generation fails
          return NextResponse.json(
            {
              error: "PNG generation failed, using JSON fallback",
              details: pngError.message,
              data: exportData,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Content-Disposition":
                  'attachment; filename="family-tree-fallback.json"',
              },
              status: 200,
            }
          );
        }

      default:
        return NextResponse.json(
          { error: "Unsupported format" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error exporting family tree:", error);
    return NextResponse.json(
      { error: "Failed to export family tree", details: error.message },
      { status: 500 }
    );
  }
}
