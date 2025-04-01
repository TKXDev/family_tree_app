import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorizedResponse } from "@/lib/server-auth";
import cloudinary, { uploadImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    console.log("Processing upload request", new Date().toISOString());

    // Check if Cloudinary is properly configured
    if (
      !cloudinary.config().cloud_name ||
      !cloudinary.config().api_key ||
      !cloudinary.config().api_secret
    ) {
      console.error("Cloudinary configuration missing");
      return NextResponse.json(
        { error: "Server configuration error - Cloudinary not configured" },
        { status: 500 }
      );
    }

    // Verify user is authenticated
    const { authenticated } = await verifyAuth(req);
    if (!authenticated) {
      console.log("Authentication failed");
      return unauthorizedResponse();
    }

    try {
      // Get the form data
      const formData = await req.formData();

      // Get the file from form data
      const file = formData.get("file") as File;
      if (!file) {
        console.log("No file found in form data");
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 }
        );
      }

      // Log file details to help debugging
      console.log(
        `File received: ${file.name}, size: ${file.size}, type: ${file.type}`
      );

      try {
        // Use our helper function to upload the image
        const secureUrl = await uploadImage(file);

        if (!secureUrl) {
          return NextResponse.json(
            { error: "Upload failed - invalid result from service" },
            { status: 500 }
          );
        }

        return NextResponse.json({ url: secureUrl });
      } catch (cloudinaryError: any) {
        console.error("Cloudinary error:", cloudinaryError);

        // Return a more descriptive error
        return NextResponse.json(
          {
            error: `Cloudinary upload failed: ${
              cloudinaryError.message || "Unknown error"
            }`,
            details: cloudinaryError.error || cloudinaryError,
          },
          { status: 500 }
        );
      }
    } catch (parseError: any) {
      console.error("Request processing error:", parseError);
      return NextResponse.json(
        {
          error: `Request processing error: ${
            parseError.message || "Unknown error"
          }`,
          stack: parseError.stack,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("General upload error:", error);
    return NextResponse.json(
      {
        error: `Failed to upload file: ${error.message || "Unknown error"}`,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
