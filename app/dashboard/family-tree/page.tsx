"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import {
  FiHome,
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiZoomIn,
  FiZoomOut,
  FiSearch,
  FiInfo,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiHeart,
  FiUsers,
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  ReactFlowProvider,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
} from "reactflow";
import "reactflow/dist/style.css";
import useSWR from "swr";
import { fetcher } from "../../lib/swr-config";

interface FamilyMember {
  _id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  death_date?: string;
  gender: string;
  generation: number;
  spouse_id?: string;
  parent_ids: string[];
  children_ids: string[];
  photo_url?: string;
}

interface Relationship {
  _id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: string;
}

interface TreeData {
  members: FamilyMember[];
  relationships: Relationship[];
}

// ProfileImage component for consistent image handling
const ProfileImage = ({
  photoUrl,
  firstName,
  lastName,
  size = 12,
}: {
  photoUrl?: string;
  firstName: string;
  lastName: string;
  size?: number;
}) => {
  const [error, setError] = useState(false);

  if (!photoUrl || error) {
    return (
      <div
        className={`h-${size} w-${size} rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center`}
      >
        <span className="text-indigo-800 font-medium">
          {firstName.charAt(0)}
          {lastName.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative h-${size} w-${size}`}>
      <Image
        className="rounded-full object-cover"
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        fill
        sizes={`(max-width: 768px) ${size * 4}px, ${size * 8}px`}
        quality={80}
        loading="eager"
        onError={() => setError(true)}
        unoptimized={photoUrl.startsWith("data:")}
      />
    </div>
  );
};

// Define proper types for the memoized component
interface MemoizedTreeProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

// Memoized Tree component to prevent unnecessary re-renders
const MemoizedTree = React.memo(
  ({ nodes, edges, onNodesChange, onEdgesChange }: MemoizedTreeProps) => {
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={1.5}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <Panel
          position="top-left"
          className="bg-white p-3 rounded-lg shadow-md"
        >
          <div className="text-sm text-gray-700">
            <div className="mb-2 font-bold">Legend:</div>
            <div className="space-y-2">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 mr-2 rounded"
                  style={{
                    backgroundColor: "#dbeafe",
                    border: "1px solid #3b82f6",
                  }}
                ></div>
                <span>Male</span>
              </div>
              <div className="flex items-center">
                <div
                  className="w-4 h-4 mr-2 rounded"
                  style={{
                    backgroundColor: "#fce7f3",
                    border: "1px solid #ec4899",
                  }}
                ></div>
                <span>Female</span>
              </div>
              <div className="flex items-center">
                <div
                  className="w-4 h-4 mr-2 rounded"
                  style={{
                    backgroundColor: "#f3e8ff",
                    border: "1px solid #a855f7",
                  }}
                ></div>
                <span>Other</span>
              </div>
              <div className="flex items-center mt-1">
                <hr className="w-6 border-gray-500 mr-2" />
                <span>Parent</span>
              </div>
              <div className="flex items-center">
                <hr className="w-6 border-red-500 border-dashed mr-2" />
                <span>Spouse</span>
              </div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    );
  }
);

MemoizedTree.displayName = "MemoizedTree"; // Required for React.memo with ESLint

const FamilyTreePage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn } = useAuth();
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [highlightedMember, setHighlightedMember] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [flowRenderError, setFlowRenderError] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Use SWR for data fetching with automatic revalidation
  const {
    data,
    error: swrError,
    mutate,
    isValidating,
  } = useSWR(isLoggedIn && isBrowser ? "/api/family-tree" : null, fetcher, {
    revalidateOnFocus: false, // Don't revalidate on focus to avoid unexpected re-renders
    dedupingInterval: 10000, // 10 seconds
    refreshInterval: 0, // Don't refresh automatically
    onSuccess: (data) => {
      setTreeData(data.data);

      // Transform data to React Flow format
      if (data.data) {
        const { nodes: flowNodes, edges: flowEdges } =
          transformDataToFlowFormat(data.data);
        setNodes(flowNodes);
        setEdges(flowEdges);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    onError: (err) => {
      setError("Failed to fetch family tree data");
      console.error(err);
      setIsLoading(false);
      setIsRefreshing(false);
      toast.error("Could not load family tree data");
    },
  });

  // Helper function for node styling
  const getNodeStyle = useCallback((gender: string, isHighlighted: boolean) => {
    const baseStyle = {
      padding: 10,
      borderRadius: 12,
      border: "1px solid #ccc",
      width: 220,
      boxShadow: isHighlighted
        ? "0 4px 12px rgba(59, 130, 246, 0.5)"
        : "0 2px 8px rgba(0, 0, 0, 0.1)",
    };

    // Gender-based styling
    if (gender === "male") {
      return {
        ...baseStyle,
        backgroundColor: isHighlighted ? "#93c5fd" : "#dbeafe",
        borderColor: "#3b82f6",
      };
    } else if (gender === "female") {
      return {
        ...baseStyle,
        backgroundColor: isHighlighted ? "#fbcfe8" : "#fce7f3",
        borderColor: "#ec4899",
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: isHighlighted ? "#d8b4fe" : "#f3e8ff",
        borderColor: "#a855f7",
      };
    }
  }, []);

  useEffect(() => {
    // Extract highlighted member ID from URL query params if any
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const highlightId = urlParams.get("highlight");
      if (highlightId) {
        setHighlightedMember(highlightId);
      }
    }
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isLoggedIn) {
      router.push("/signin");
    }
  }, [loading, isLoggedIn, router]);

  // Transform tree data to React Flow format
  const transformDataToFlowFormat = useCallback(
    (data: TreeData) => {
      if (!data || !data.members) return { nodes: [], edges: [] };

      // Create nodes from family members
      const flowNodes = data.members.map((member) => {
        // Calculate X position based on generation gaps
        const generations = [
          ...new Set(data.members.map((m) => m.generation)),
        ].sort();
        const xPosition = (generations.indexOf(member.generation) + 1) * 300;

        // Calculate Y position to spread members within the same generation
        const sameGenMembers = data.members.filter(
          (m) => m.generation === member.generation
        );
        const yIndex = sameGenMembers.findIndex((m) => m._id === member._id);
        const yPosition = (yIndex + 1) * 150;

        // Format dates
        const birthDate = new Date(member.birth_date).toLocaleDateString();
        const lifespan = member.death_date
          ? `${birthDate} - ${new Date(member.death_date).toLocaleDateString()}`
          : `${birthDate} - Present`;

        const isHighlighted = highlightedMember === member._id;

        return {
          id: member._id,
          position: { x: xPosition, y: yPosition },
          data: {
            label: (
              <div>
                <div className="flex justify-center mb-2">
                  <ProfileImage
                    photoUrl={member.photo_url}
                    firstName={member.first_name}
                    lastName={member.last_name}
                  />
                </div>
                <div className="font-bold text-gray-800">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-xs text-gray-600">{lifespan}</div>
                <div className="text-xs text-gray-500">
                  Generation: {member.generation}
                </div>
                <div className="mt-2 flex justify-center space-x-2">
                  <Link
                    href={`/dashboard/edit-member/${member._id}`}
                    className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <FiEdit size={14} />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(member._id);
                    }}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ),
            member,
          },
          style: getNodeStyle(member.gender, isHighlighted),
        };
      });

      // Create parent-child edges
      const flowEdges: Array<{
        id: string;
        source: string;
        target: string;
        type?: string;
        markerEnd?: any;
        style?: any;
        animated?: boolean;
        label?: string;
      }> = [];

      // Parent-child relationships
      data.members.forEach((member) => {
        if (member.parent_ids && member.parent_ids.length > 0) {
          member.parent_ids.forEach((parentId) => {
            flowEdges.push({
              id: `p-${parentId}-${member._id}`,
              source: parentId,
              target: member._id,
              type: "smoothstep",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
              },
              style: { stroke: "#6b7280" },
              animated: false,
              label: "parent",
            });
          });
        }
      });

      // Spouse relationships
      data.members.forEach((member) => {
        if (member.spouse_id) {
          // Only add one edge per spouse pair (to avoid duplicates)
          if (member._id < member.spouse_id) {
            flowEdges.push({
              id: `s-${member._id}-${member.spouse_id}`,
              source: member._id,
              target: member.spouse_id,
              type: "straight",
              style: { stroke: "#ef4444", strokeDasharray: "5,5" },
              animated: true,
              label: "spouse",
            });
          }
        }
      });

      return { nodes: flowNodes, edges: flowEdges };
    },
    [getNodeStyle, highlightedMember]
  );

  const refreshFamilyTree = async () => {
    setIsRefreshing(true);
    // Use SWR's mutate to revalidate data
    await mutate();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this family member?")) {
      try {
        const response = await fetch(`/api/member/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete family member");
        }

        toast.success("Family member deleted successfully");
        // Refresh data using SWR's mutate
        await mutate();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete family member");
      }
    }
  };

  // Helper function to find spouse name
  const getSpouseName = (spouseId: string | undefined) => {
    if (!spouseId || !treeData) return "None";
    const spouse = treeData.members.find((m) => m._id === spouseId);
    return spouse ? `${spouse.first_name} ${spouse.last_name}` : "None";
  };

  // Helper function to get children names
  const getChildrenNames = (childrenIds: string[]) => {
    if (!childrenIds.length || !treeData) return "None";
    return childrenIds
      .map((childId) => {
        const child = treeData.members.find((m) => m._id === childId);
        return child ? `${child.first_name} ${child.last_name}` : "";
      })
      .filter(Boolean)
      .join(", ");
  };

  // Filter members based on search query
  const filteredMembers = treeData?.members?.filter((member) => {
    if (!searchQuery) return true;
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  // Debug logs for tracking ReactFlow rendering
  useEffect(() => {
    if (isBrowser && nodes.length > 0) {
      console.log(
        "Browser ready, nodes prepared for ReactFlow rendering:",
        nodes.length,
        "nodes,",
        edges.length,
        "edges"
      );
    }
  }, [isBrowser, nodes.length, edges.length]);

  // Function to safely render the ReactFlow component
  const renderReactFlow = useCallback(() => {
    if (!isBrowser || nodes.length === 0 || flowRenderError) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center p-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <FiInfo className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {!isBrowser || isLoading
                ? "Loading visualization..."
                : flowRenderError
                ? "Error loading visualization"
                : "No family tree to display"}
            </h3>
            <p className="text-gray-500 max-w-md mb-4">
              {!isBrowser || isLoading
                ? "Please wait while we prepare your family tree..."
                : flowRenderError
                ? "There was a problem rendering your family tree. Please try refreshing the page."
                : treeData?.members?.length === 0
                ? "Add family members to visualize your family tree"
                : "No data available for visualization"}
            </p>
            {treeData?.members?.length === 0 &&
              isBrowser &&
              !isLoading &&
              !flowRenderError && (
                <Link href="/dashboard/add-member">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                    <FiPlus className="mr-2" /> Add Your First Member
                  </button>
                </Link>
              )}
          </div>
        </div>
      );
    }

    try {
      return (
        <ReactFlowProvider>
          <MemoizedTree
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
          />
        </ReactFlowProvider>
      );
    } catch (error) {
      console.error("Error rendering ReactFlow:", error);
      setFlowRenderError(true);
      return null;
    }
  }, [
    isBrowser,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    flowRenderError,
    isLoading,
    treeData,
  ]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <FiArrowLeft className="mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Family Tree
                </h1>
              </div>
              <div className="md:hidden">
                <Link
                  href="/dashboard/add-member"
                  className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <FiPlus />
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search family members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                />
              </div>

              <div className="hidden md:block">
                <Link
                  href="/dashboard/add-member"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <FiPlus className="mr-2" /> Add New Member
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Tree Visualization */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Family Tree Visualization
                  </h2>
                  <p className="text-sm text-gray-500">
                    Interactive family tree diagram
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refreshFamilyTree}
                    disabled={isRefreshing}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition-colors"
                    title="Refresh tree"
                  >
                    <FiRefreshCw
                      className={isRefreshing ? "animate-spin" : ""}
                    />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition-colors"
                    title="Download as image (not implemented)"
                  >
                    <FiDownload />
                  </button>
                </div>
              </div>

              <div className="h-[600px] w-full">{renderReactFlow()}</div>
            </div>

            {/* Members List */}
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Family Members
                  </h3>
                  <p className="text-sm text-gray-500">
                    {filteredMembers?.length || 0}{" "}
                    {filteredMembers?.length === 1 ? "member" : "members"} in
                    your family tree
                  </p>
                </div>
                <div className="flex gap-2">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-3 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      Clear search
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition-colors"
                    title="Filter options"
                  >
                    <FiFilter />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Birth Date
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Generation
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Spouse
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Children
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMembers?.length ? (
                        filteredMembers.map((member) => (
                          <tr
                            key={member._id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <ProfileImage
                                    photoUrl={member.photo_url}
                                    firstName={member.first_name}
                                    lastName={member.last_name}
                                    size={10}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {member.first_name} {member.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500 capitalize">
                                    {member.gender}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(
                                  member.birth_date
                                ).toLocaleDateString()}
                              </div>
                              {member.death_date && (
                                <div className="text-sm text-gray-500">
                                  †{" "}
                                  {new Date(
                                    member.death_date
                                  ).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                Gen {member.generation}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getSpouseName(member.spouse_id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getChildrenNames(member.children_ids)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-3">
                                <Link
                                  href={`/dashboard/edit-member/${member._id}`}
                                  className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                  title="Edit member"
                                >
                                  <FiEdit className="h-5 w-5" />
                                </Link>
                                <button
                                  onClick={() => handleDelete(member._id)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Delete member"
                                >
                                  <FiTrash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center">
                            {searchQuery ? (
                              <div className="text-gray-500">
                                <p className="font-medium">No matches found</p>
                                <p className="text-sm">
                                  Try a different search term
                                </p>
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                <p className="font-medium mb-2">
                                  No family members found
                                </p>
                                <Link
                                  href="/dashboard/add-member"
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                  <FiPlus className="mr-2" /> Add Your First
                                  Member
                                </Link>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List View */}
                <div className="md:hidden">
                  {filteredMembers?.length ? (
                    <div className="space-y-4">
                      {filteredMembers.map((member) => (
                        <div
                          key={member._id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <ProfileImage
                                    photoUrl={member.photo_url}
                                    firstName={member.first_name}
                                    lastName={member.last_name}
                                    size={12}
                                  />
                                </div>
                                <div>
                                  <h3 className="text-base font-medium text-gray-900">
                                    {member.first_name} {member.last_name}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-sm text-gray-500 capitalize">
                                      {member.gender}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                      Gen {member.generation}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Link
                                  href={`/dashboard/edit-member/${member._id}`}
                                  className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-full transition-colors"
                                  title="Edit member"
                                >
                                  <FiEdit className="h-5 w-5" />
                                </Link>
                                <button
                                  onClick={() => handleDelete(member._id)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                  title="Delete member"
                                >
                                  <FiTrash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-sm text-gray-600">
                                <FiCalendar className="mr-2 h-4 w-4 text-gray-400" />
                                <span>
                                  {new Date(
                                    member.birth_date
                                  ).toLocaleDateString()}
                                  {member.death_date &&
                                    ` - ${new Date(
                                      member.death_date
                                    ).toLocaleDateString()}`}
                                </span>
                              </div>
                              {member.spouse_id && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <FiHeart className="mr-2 h-4 w-4 text-pink-400" />
                                  <span>{getSpouseName(member.spouse_id)}</span>
                                </div>
                              )}
                              {member.children_ids.length > 0 && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <FiUsers className="mr-2 h-4 w-4 text-indigo-400" />
                                  <span>
                                    {getChildrenNames(member.children_ids)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      {searchQuery ? (
                        <div className="text-gray-500">
                          <p className="font-medium">No matches found</p>
                          <p className="text-sm">Try a different search term</p>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <p className="font-medium mb-2">
                            No family members found
                          </p>
                          <Link
                            href="/dashboard/add-member"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                          >
                            <FiPlus className="mr-2" /> Add Your First Member
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FamilyTreePage;
