"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
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
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiClock,
  FiHash,
  FiMinus,
  FiPlus as FiPlusIcon,
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
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import useSWR from "swr";
import { fetcher } from "../../lib/swr-config";
import { useTree } from "@/lib/hooks/useTree";
import { useDynamicPageTitle } from "@/lib/hooks/usePageTitle";
import Cookies from "js-cookie";
import { isAdmin } from "@/lib/auth";
import WarningDialog from "@/components/ui/WarningDialog";
import Navbar from "@/components/ui/Navbar";

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

// Define nodeTypes and edgeTypes outside of components to prevent recreation on each render
const nodeTypes = {};
const edgeTypes = {};

/**
 * Memoized component for displaying profile images to prevent re-renders
 */
const ProfileImage = React.memo(
  ({
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
  }
);

ProfileImage.displayName = "ProfileImage";

// Define proper types for the memoized component
interface MemoizedTreeProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeTypes: Record<string, React.ComponentType<any>>;
  edgeTypes: Record<string, React.ComponentType<any>>;
  onInit: (instance: ReactFlowInstance) => void;
}

// Memoized Tree component to prevent unnecessary re-renders
const MemoizedTree = memo(
  ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    nodeTypes,
    edgeTypes,
    onInit,
  }: MemoizedTreeProps) => {
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.nodes === nextProps.nodes && prevProps.edges === nextProps.edges
    );
  }
);

MemoizedTree.displayName = "MemoizedTree"; // Required for React.memo with ESLint

// Memoized search input component to prevent re-renders
const SearchInput = React.memo(
  ({
    value,
    onChange,
    onClear,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
  }) => {
    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Search family members..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 px-3 flex items-center"
          >
            <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

// Memoized export button component
const ExportButton = React.memo(
  ({
    format,
    onClick,
    isExporting,
  }: {
    format: "png" | "pdf" | "json";
    onClick: () => void;
    isExporting: boolean;
  }) => {
    const formatLabels = {
      png: "PNG Image",
      pdf: "PDF Document",
      json: "JSON Data",
    };

    return (
      <button
        onClick={onClick}
        disabled={isExporting}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <span className="animate-spin mr-2">⭘</span> Exporting...
          </>
        ) : (
          <>
            <FiDownload className="mr-2" /> {formatLabels[format]}
          </>
        )}
      </button>
    );
  }
);

ExportButton.displayName = "ExportButton";

const FamilyTreePage = () => {
  const router = useRouter();
  const { user, loading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("tree");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBrowser, setIsBrowser] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const userIsAdmin = isAdmin(user);
  const [highlightedMember, setHighlightedMember] = useState<string | null>(
    null
  );
  const [flowRenderError, setFlowRenderError] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    generation: "",
    gender: "",
    minAge: "",
    maxAge: "",
    hasSpouse: "",
    hasChildren: "",
  });
  const {
    tree,
    loading: treeLoading,
    error: treeError,
    fetchTree,
    exportTree,
  } = useTree();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Filter members based on search query and filters - memoized to avoid recalculation
  const filteredMembers = useMemo(() => {
    if (!treeData?.members) return [];

    return treeData.members.filter((member) => {
      // Text search filter
      const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
      const matchesSearch =
        !searchQuery || fullName.includes(searchQuery.toLowerCase());

      // Generation filter
      const matchesGeneration =
        !filters.generation ||
        member.generation.toString() === filters.generation;

      // Gender filter
      const matchesGender = !filters.gender || member.gender === filters.gender;

      // Age filter
      const birthDate = new Date(member.birth_date);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const matchesMinAge = !filters.minAge || age >= parseInt(filters.minAge);
      const matchesMaxAge = !filters.maxAge || age <= parseInt(filters.maxAge);

      // Spouse filter
      const matchesSpouse =
        !filters.hasSpouse ||
        (filters.hasSpouse === "yes" && member.spouse_id) ||
        (filters.hasSpouse === "no" && !member.spouse_id);

      // Children filter
      const matchesChildren =
        !filters.hasChildren ||
        (filters.hasChildren === "yes" && member.children_ids.length > 0) ||
        (filters.hasChildren === "no" && member.children_ids.length === 0);

      return (
        matchesSearch &&
        matchesGeneration &&
        matchesGender &&
        matchesMinAge &&
        matchesMaxAge &&
        matchesSpouse &&
        matchesChildren
      );
    });
  }, [searchQuery, treeData?.members, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      generation: "",
      gender: "",
      minAge: "",
      maxAge: "",
      hasSpouse: "",
      hasChildren: "",
    });
  };

  // Use the custom hook for dynamic page title
  useDynamicPageTitle({
    title: "Family Tree",
    loading: isLoading,
    error,
    count: treeData?.members?.length,
    searchQuery: searchQuery || undefined,
    searchResults: searchQuery ? filteredMembers : undefined,
  });

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

  // Helper function for node styling - memoized to prevent recreation
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

  // Transform tree data to React Flow format - memoized for performance
  const transformDataToFlowFormat = useCallback(
    (data: TreeData) => {
      if (!data || !data.members) return { nodes: [], edges: [] };

      // Use the same filtered members as the table view
      const flowNodes = filteredMembers.map((member) => {
        // Calculate X position based on generation gaps
        const generations = [
          ...new Set(filteredMembers.map((m) => m.generation)),
        ].sort();
        const xPosition = (generations.indexOf(member.generation) + 1) * 300;

        // Calculate Y position to spread members within the same generation
        const sameGenMembers = filteredMembers.filter(
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
                  {userIsAdmin && (
                    <Link
                      href={`/dashboard/edit-member/${member._id}`}
                      className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <FiEdit size={14} />
                    </Link>
                  )}
                  {userIsAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(member._id);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ),
            member,
          },
          style: getNodeStyle(member.gender, isHighlighted),
        };
      });

      // Create edges only between filtered members
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
      filteredMembers.forEach((member) => {
        if (member.parent_ids && member.parent_ids.length > 0) {
          member.parent_ids.forEach((parentId) => {
            // Only create edge if parent is also in filtered members
            if (filteredMembers.some((m) => m._id === parentId)) {
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
            }
          });
        }
      });

      // Spouse relationships
      filteredMembers.forEach((member) => {
        if (member.spouse_id) {
          // Only create edge if spouse is also in filtered members
          if (filteredMembers.some((m) => m._id === member.spouse_id)) {
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
        }
      });

      return { nodes: flowNodes, edges: flowEdges };
    },
    [highlightedMember, getNodeStyle, userIsAdmin, filteredMembers]
  );

  // Memoize the transformed data to prevent unnecessary recalculations
  const flowData = useMemo(() => {
    if (!treeData) return { nodes: [], edges: [] };
    return transformDataToFlowFormat(treeData);
  }, [treeData, transformDataToFlowFormat]);

  // Update nodes and edges when flowData changes
  useEffect(() => {
    if (flowData.nodes.length > 0) {
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
    }
  }, [flowData, setNodes, setEdges]);

  // Handle search with debounce
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  // Handle export with loading state
  const handleExport = useCallback(
    async (format: "png" | "pdf" | "json") => {
      setIsExporting(true);

      // Display toast notification for loading state
      const loadingToast = toast.loading(
        `Exporting family tree as ${format.toUpperCase()}...`
      );

      try {
        const exportedData = await exportTree(format);

        // Create object URL and trigger download
        const url = window.URL.createObjectURL(exportedData);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `family-tree.${format}`);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          `Family tree exported as ${format.toUpperCase()} successfully!`,
          {
            id: loadingToast,
          }
        );
      } catch (err: any) {
        console.error(`Export error (${format}):`, err);

        // Check if the error response contains a JSON payload with more details
        let errorMessage = `Failed to export as ${format.toUpperCase()}`;

        try {
          // If the error has a response that can be parsed as JSON
          if (err.response && err.response.json) {
            const errorData = await err.response.json();
            if (errorData.error) {
              errorMessage = `${errorData.error}${
                errorData.details ? ": " + errorData.details : ""
              }`;

              // If we got JSON data back as a fallback, download it
              if (errorData.data && format !== "json") {
                const jsonBlob = new Blob(
                  [JSON.stringify(errorData.data, null, 2)],
                  {
                    type: "application/json",
                  }
                );
                const url = window.URL.createObjectURL(jsonBlob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `family-tree-fallback.json`);
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                window.URL.revokeObjectURL(url);

                errorMessage += ". JSON fallback has been downloaded.";
              }
            }
          }
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
        }

        toast.error(errorMessage, {
          id: loadingToast,
        });
      } finally {
        setIsExporting(false);
      }
    },
    [exportTree]
  );

  // Function to refresh the tree data
  const refreshTree = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Reset search query
      setSearchQuery("");

      // Reset highlighted member
      setHighlightedMember(null);

      // Reset selected member
      setSelectedMemberId(null);

      // Reset active tab to tree view
      setActiveTab("tree");

      // Reset any filters or sorting
      // (Add any additional state resets here)

      // Fetch fresh data from the server
      await mutate();

      // Reset the flow view to initial position
      if (reactFlowInstance) {
        // Small delay to ensure the flow is rendered with new data
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.2 });
        }, 100);
      }

      toast.success("Family tree refreshed");
    } catch (err) {
      console.error("Error refreshing tree:", err);
      toast.error("Failed to refresh family tree");
    } finally {
      setIsRefreshing(false);
    }
  }, [mutate, reactFlowInstance]);

  const handleDeleteClick = (memberId: string) => {
    setMemberToDelete(memberId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/members/${memberToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete member");
      }

      toast.success("Family member deleted successfully");
      // Refresh the tree data
      fetchTreeData();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete member"
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
      setMemberToDelete(null);
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

    // Only show first 2 children names, then add "..." if there are more
    const MAX_CHILDREN_TO_DISPLAY = 2;

    const childrenNames = childrenIds
      .map((childId) => {
        const child = treeData.members.find((m) => m._id === childId);
        return child ? `${child.first_name} ${child.last_name}` : "";
      })
      .filter(Boolean);

    if (childrenNames.length <= MAX_CHILDREN_TO_DISPLAY) {
      return childrenNames.join(", ");
    } else {
      const displayedNames = childrenNames.slice(0, MAX_CHILDREN_TO_DISPLAY);
      return `${displayedNames.join(", ")} ... (${
        childrenNames.length - MAX_CHILDREN_TO_DISPLAY
      } more)`;
    }
  };

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

  // Memoize nodeTypes and edgeTypes to prevent recreation on each render
  const memoizedNodeTypes = useMemo(() => ({}), []);
  const memoizedEdgeTypes = useMemo(() => ({}), []);

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
              !flowRenderError &&
              userIsAdmin && (
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
            nodeTypes={memoizedNodeTypes}
            edgeTypes={memoizedEdgeTypes}
            onInit={setReactFlowInstance}
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
    memoizedNodeTypes,
    memoizedEdgeTypes,
    flowRenderError,
    isLoading,
    treeData,
    userIsAdmin,
    setReactFlowInstance,
  ]);

  const fetchTreeData = async () => {
    try {
      const response = await fetch("/api/family-tree");
      if (!response.ok) {
        throw new Error("Failed to fetch family tree data");
      }
      const data = await response.json();
      setTreeData(data.data);
    } catch (error) {
      console.error("Error fetching tree data:", error);
      toast.error("Failed to load family tree data");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Toaster position="top-right" />
      <WarningDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Family Member"
        message="Are you sure you want to delete this family member? This action cannot be undone and will affect the entire family tree structure."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <Navbar title="Family Tree" showBackButton={true}>
        <div className="flex gap-2">
          <button
            onClick={refreshTree}
            disabled={isRefreshing || isLoading}
            className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
          >
            {isRefreshing ? (
              <span className="animate-spin mr-2">⭘</span>
            ) : (
              <FiRefreshCw className="mr-2" />
            )}
            Refresh
          </button>

          {userIsAdmin && (
            <Link
              href="/dashboard/add-member"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <FiPlus className="mr-2" />
              <span className="hidden sm:inline">Add Member</span>
            </Link>
          )}
        </div>
      </Navbar>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-6">
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchInput
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onClear={clearSearch}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Filter options"
                >
                  <FiFilter />
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setShowFilters(false)}
                  />

                  {/* Filter Dialog */}
                  <div className="fixed inset-0 sm:inset-x-4 sm:top-20 sm:bottom-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-2xl w-full bg-white/80 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 z-50 overflow-y-auto sm:max-h-[calc(100vh-8rem)]">
                    <div className="p-4 sm:p-6">
                      {/* Header - Sticky on mobile */}
                      <div className="sticky top-0 bg-white/80 backdrop-blur-md -mx-4 -mt-4 px-4 pt-4 pb-2 sm:mx-0 sm:mt-0 sm:px-0 sm:pt-0 sm:pb-0 sm:relative sm:bg-transparent">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <FiFilter className="mr-2 text-indigo-500" />
                            Filter Family Members
                          </h3>
                          <button
                            onClick={() => setShowFilters(false)}
                            className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                            title="Close filters"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Filter Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Generation Filter */}
                        <div className="bg-gray-50/50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FiHash className="mr-2 text-indigo-500" />
                            Generation
                          </label>
                          <select
                            value={filters.generation}
                            onChange={(e) =>
                              handleFilterChange("generation", e.target.value)
                            }
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">All Generations</option>
                            {Array.from(
                              new Set(
                                treeData?.members.map((m) => m.generation) || []
                              )
                            )
                              .sort((a, b) => a - b)
                              .map((gen) => (
                                <option key={gen} value={gen}>
                                  Generation {gen}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Gender Filter */}
                        <div className="bg-gray-50/50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FiUser className="mr-2 text-indigo-500" />
                            Gender
                          </label>
                          <select
                            value={filters.gender}
                            onChange={(e) =>
                              handleFilterChange("gender", e.target.value)
                            }
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">All Genders</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Age Range Filter */}
                        <div className="bg-gray-50/50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FiClock className="mr-2 text-indigo-500" />
                            Age Range
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                placeholder="Min"
                                value={filters.minAge}
                                onChange={(e) =>
                                  handleFilterChange("minAge", e.target.value)
                                }
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                            <span className="text-gray-500">to</span>
                            <div className="flex-1">
                              <input
                                type="number"
                                placeholder="Max"
                                value={filters.maxAge}
                                onChange={(e) =>
                                  handleFilterChange("maxAge", e.target.value)
                                }
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Spouse Filter */}
                        <div className="bg-gray-50/50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FiHeart className="mr-2 text-indigo-500" />
                            Has Spouse
                          </label>
                          <select
                            value={filters.hasSpouse}
                            onChange={(e) =>
                              handleFilterChange("hasSpouse", e.target.value)
                            }
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">All</option>
                            <option value="yes">Has Spouse</option>
                            <option value="no">No Spouse</option>
                          </select>
                        </div>

                        {/* Children Filter */}
                        <div className="bg-gray-50/50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FiUsers className="mr-2 text-indigo-500" />
                            Has Children
                          </label>
                          <select
                            value={filters.hasChildren}
                            onChange={(e) =>
                              handleFilterChange("hasChildren", e.target.value)
                            }
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">All</option>
                            <option value="yes">Has Children</option>
                            <option value="no">No Children</option>
                          </select>
                        </div>

                        {/* Active Filters Summary */}
                        <div className="bg-indigo-50/50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-indigo-900 mb-2">
                            Active Filters
                          </h4>
                          <div className="space-y-2">
                            {filters.generation && (
                              <div className="flex items-center text-sm text-indigo-700">
                                <FiHash className="mr-2" />
                                Generation {filters.generation}
                              </div>
                            )}
                            {filters.gender && (
                              <div className="flex items-center text-sm text-indigo-700">
                                <FiUser className="mr-2" />
                                {filters.gender.charAt(0).toUpperCase() +
                                  filters.gender.slice(1)}
                              </div>
                            )}
                            {(filters.minAge || filters.maxAge) && (
                              <div className="flex items-center text-sm text-indigo-700">
                                <FiClock className="mr-2" />
                                {filters.minAge && filters.maxAge
                                  ? `Age ${filters.minAge}-${filters.maxAge}`
                                  : filters.minAge
                                  ? `Age ≥ ${filters.minAge}`
                                  : `Age ≤ ${filters.maxAge}`}
                              </div>
                            )}
                            {filters.hasSpouse && (
                              <div className="flex items-center text-sm text-indigo-700">
                                <FiHeart className="mr-2" />
                                {filters.hasSpouse === "yes"
                                  ? "Has Spouse"
                                  : "No Spouse"}
                              </div>
                            )}
                            {filters.hasChildren && (
                              <div className="flex items-center text-sm text-indigo-700">
                                <FiUsers className="mr-2" />
                                {filters.hasChildren === "yes"
                                  ? "Has Children"
                                  : "No Children"}
                              </div>
                            )}
                            {!filters.generation &&
                              !filters.gender &&
                              !filters.minAge &&
                              !filters.maxAge &&
                              !filters.hasSpouse &&
                              !filters.hasChildren && (
                                <div className="text-sm text-indigo-700">
                                  No active filters
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Clear Filters Button - Sticky on mobile */}
                      <div className="sticky bottom-0 bg-white/80 backdrop-blur-md -mx-4 -mb-4 px-4 pb-4 pt-2 mt-6 border-t border-gray-200 sm:mx-0 sm:mb-0 sm:px-0 sm:pb-0 sm:pt-4 sm:relative sm:bg-transparent">
                        <button
                          onClick={clearFilters}
                          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                        >
                          <FiX className="mr-2" />
                          Clear All Filters
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50/80 border-l-4 border-red-400 p-4 rounded-lg shadow-lg backdrop-blur-sm">
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
            <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden my-2 backdrop-blur-md border border-white/20">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <div>
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    Family Tree Visualization
                  </h2>
                  <p className="text-sm text-gray-500">
                    Interactive family tree diagram
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {userIsAdmin && (
                    <Link href="/dashboard/add-member">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200">
                        <FiPlus className="mr-2" />
                        <span className="hidden sm:inline">Add Member</span>
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={refreshTree}
                    disabled={isRefreshing}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                    title="Refresh family tree"
                  >
                    <FiRefreshCw
                      className={`mr-2 h-4 w-4 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                  <div className="relative group">
                    <button
                      disabled={isExporting}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                    >
                      <FiDownload className="mr-2 h-4 w-4" />
                      {isExporting ? "Exporting..." : "Export"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-[600px] w-full bg-gradient-to-br from-gray-50 to-gray-100/50">
                {renderReactFlow()}
              </div>
            </div>

            {/* Members List */}
            <div className="bg-white/80 shadow-xl rounded-2xl overflow-hidden my-2 backdrop-blur-md border border-white/20">
              <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
                <div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
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
                      className="px-4 py-2 text-sm text-gray-600 bg-white/80 hover:bg-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Clear search
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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
                    <thead className="bg-gray-50/80">
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
                    <tbody className="bg-white/80 divide-y divide-gray-200">
                      {filteredMembers?.length ? (
                        filteredMembers.map((member) => (
                          <tr
                            key={member._id}
                            className="hover:bg-white/80 transition-all duration-200"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  <ProfileImage
                                    photoUrl={member.photo_url}
                                    firstName={member.first_name}
                                    lastName={member.last_name}
                                    size={12}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-gray-900">
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
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                                Gen {member.generation}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getSpouseName(member.spouse_id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {getChildrenNames(member.children_ids)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {userIsAdmin && (
                                <div className="flex items-center space-x-2">
                                  <Link
                                    href={`/dashboard/edit-member/${member._id}`}
                                    className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                  >
                                    <FiEdit className="h-4 w-4" />
                                  </Link>
                                  <button
                                    onClick={() =>
                                      handleDeleteClick(member._id)
                                    }
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center">
                            <div className="text-gray-500">
                              {searchQuery ? (
                                <div>
                                  <p className="font-medium">
                                    No matches found
                                  </p>
                                  <p className="text-sm">
                                    Try a different search term
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-medium mb-2">
                                    No family members found
                                  </p>
                                  {userIsAdmin && (
                                    <Link
                                      href="/dashboard/add-member"
                                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                                    >
                                      <FiPlus className="mr-2" />
                                      <span className="hidden sm:inline">
                                        Add Member
                                      </span>
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {filteredMembers?.length ? (
                    <div className="space-y-4 p-4">
                      {filteredMembers.map((member) => (
                        <div
                          key={member._id}
                          className="bg-white/80 rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
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
                                  <h3 className="text-base font-semibold text-gray-900">
                                    {member.first_name} {member.last_name}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-sm text-gray-500 capitalize">
                                      {member.gender}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                                      Gen {member.generation}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {userIsAdmin && (
                                <div className="flex items-center space-x-2">
                                  <Link
                                    href={`/dashboard/edit-member/${member._id}`}
                                    className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                  >
                                    <FiEdit className="h-4 w-4" />
                                  </Link>
                                  <button
                                    onClick={() =>
                                      handleDeleteClick(member._id)
                                    }
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 px-3 py-2 rounded-lg">
                                <FiCalendar className="mr-2 h-4 w-4 text-indigo-500" />
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
                                <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 px-3 py-2 rounded-lg">
                                  <FiHeart className="mr-2 h-4 w-4 text-pink-500" />
                                  <span>{getSpouseName(member.spouse_id)}</span>
                                </div>
                              )}
                              {member.children_ids.length > 0 && (
                                <div className="flex items-center text-sm text-gray-600 bg-gray-50/50 px-3 py-2 rounded-lg">
                                  <FiUsers className="mr-2 h-4 w-4 text-indigo-500" />
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
                          {userIsAdmin && (
                            <Link
                              href="/dashboard/add-member"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                            >
                              <FiPlus className="mr-2" />
                              <span className="hidden sm:inline">
                                Add Member
                              </span>
                            </Link>
                          )}
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
