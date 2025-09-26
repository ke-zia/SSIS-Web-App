import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Card,
  CardContent
} from "../components/ui/card";
import { College } from "../types/college";
import {
  getAllColleges,
  deleteCollege,
} from "../services/collegeService";
import AddEditCollege from "../components/college/AddEditCollege";
import DeleteCollege from "../components/college/DeleteCollege";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  ChevronRight, 
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown
} from "lucide-react";
import { debounce } from "../utils/helpers";

const CollegesPage: React.FC = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<"all" | "code" | "name">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collegeToDelete, setCollegeToDelete] = useState<College | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [successToast, setSuccessToast] = useState({
    isOpen: false,
    message: "",
  });

  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300),
    []
  );

  const fetchColleges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllColleges(
        sortBy || undefined,
        sortBy ? sortOrder : undefined,
        searchQuery || undefined,
        searchBy
      );
      setColleges(data);
    } catch (err) {
      console.error("Failed to fetch colleges:", err);
      setError("Failed to load colleges. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [sortBy, sortOrder, searchQuery, searchBy]);

  const openAddDialog = () => {
    setSelectedCollege(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (college: College) => {
    setSelectedCollege(college);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (college: College) => {
    setCollegeToDelete(college);
    setIsDeleteDialogOpen(true);
  };

  const handleModalSuccess = async () => {
    await fetchColleges();
    showSuccessToast(
      selectedCollege 
        ? "College updated successfully!" 
        : "College added successfully!"
    );
  };

  const handleDelete = async () => {
    if (!collegeToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteCollege(collegeToDelete.id);
      await fetchColleges();
      showSuccessToast("College deleted successfully!");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete college";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsDeleting(false);
      setCollegeToDelete(null);
    }
  };

  // Helper function to get sort icon based on sort state
  const getSortIcon = (columnId: string) => {
    if (sortBy !== columnId) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    
    return sortOrder === "desc" ? (
      <ArrowDown className="h-4 w-4 ml-1 text-red-600" />
    ) : (
      <ArrowUp className="h-4 w-4 ml-1 text-red-600" />
    );
  };

  // Handle column sorting with 3-state cycle (triggers backend fetch)
  const handleSort = (columnId: string) => {
    if (sortBy !== columnId) {
      // First click: ascending
      setSortBy(columnId);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      // Second click: descending
      setSortOrder("desc");
    } else {
      // Third click: clear sorting
      setSortBy("");
      setSortOrder("asc");
    }
  };

  const columns = useMemo<ColumnDef<College>[]>(
    () => [
      {
        accessorKey: "code",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("code")}
            className="h-8 px-2 hover:bg-transparent font-semibold"
          >
            Code
            {getSortIcon("code")}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-gray-900">
            {row.getValue("code")}
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: "name",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("name")}
            className="h-8 px-2 hover:bg-transparent font-semibold"
          >
            Name
            {getSortIcon("name")}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-gray-700">{row.getValue("name")}</div>
        ),
        size: 500,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const college = row.original;
          return (
            <div className="flex gap-2 justify-start">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditDialog(college)}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openDeleteDialog(college)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        size: 100,
        enableSorting: false,
      },
    ],
    [sortBy, sortOrder]
  );

  // Note: Filtering is now handled by the backend
  // Colleges are already filtered when received from the API
  const filteredColleges = colleges;

  // Calculate pagination
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedColleges = filteredColleges.slice(startIndex, endIndex);
  const displayTotal = filteredColleges.length;

  // Update table with paginated data
  const table = useReactTable({
    data: paginatedColleges,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEntriesPerPageChange = (value: string) => {
    const newEntries = parseInt(value);
    setEntriesPerPage(newEntries);
    setCurrentPage(1);
  };

  const handleSearchByChange = (value: string) => {
    setSearchBy(value as "all" | "code" | "name");
    setCurrentPage(1);
  };

  const showSuccessToast = (message: string) => {
    setSuccessToast({ isOpen: true, message });
    setTimeout(() => {
      setSuccessToast({ isOpen: false, message: "" });
    }, 3000);
  };

  // Custom pagination component for 1-2-3 style
  const CustomPagination = () => {
    const totalPages = Math.ceil(displayTotal / entriesPerPage) || 1;
    const startEntry = displayTotal === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
    const endEntry = Math.min(currentPage * entriesPerPage, displayTotal);

    // Generate page numbers to show (1, 2, 3 style)
    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 3;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 2) {
          pages.push(1, 2, 3);
        } else if (currentPage >= totalPages - 1) {
          pages.push(totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(currentPage - 1, currentPage, currentPage + 1);
        }
      }
      return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex items-center justify-between w-full">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{startEntry}-{endEntry}</span> of <span className="font-medium">{displayTotal}</span> colleges
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading || displayTotal === 0}
            className="h-8 px-2 gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-red-200 hover:bg-red-300' : ''}`}
                disabled={isLoading}
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || displayTotal === 0 || isLoading}
            className="h-8 px-2 gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 bg-white flex flex-col relative p-6" style={{ fontFamily: "'Poppins', sans-serif" }}>

      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Colleges Management</h1>
          <p className="text-gray-600">
            Manage all college departments and programs
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {successToast.isOpen && (
          <div className="fixed top-4 right-4 z-50 bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200 shadow-lg animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="font-medium">✓ {successToast.message}</span>
            </div>
          </div>
        )}

        {/* Stats and Add Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Stats Card */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Colleges</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{colleges.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <Building2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add College Card */}
          <Card className="border border-gray-200 shadow-sm md:col-span-3">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Add new college to the system</p>
                  <p className="text-xs text-gray-500 mt-1">Create departments and programs under each college</p>
                </div>
                <Button
                  onClick={openAddDialog}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add College
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="border border-gray-200 shadow-sm">
          {/* Controls Bar */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap w-full">
                {/* Left side: Search section */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <Input
                      placeholder="Search colleges..."
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9 border-gray-300 w-full"
                    />
                  </div>
                  
                  {/* Search by dropdown - updated with "all" option */}
                  <Select
                    value={searchBy}
                    onChange={(e) => handleSearchByChange(e.target.value)}
                    className="w-[150px] border-gray-300 h-9 text-sm"
                  >
                    <option value="all">Search by</option>
                    <option value="name">Name</option>
                    <option value="code">Code</option>
                  </Select>
                </div>
                
                {/* Right side: Show entries section */}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
                    Show
                  </div>
                  <Select
                    value={entriesPerPage.toString()}
                    onChange={(e) => handleEntriesPerPageChange(e.target.value)}
                    className="w-[120px] border-gray-300 h-9 text-sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </Select>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    entries
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="border-b border-gray-200 overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="text-gray-600">Loading colleges...</div>
              </div>
            ) : (
              <Table className="w-full">
                <TableHeader className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-b border-gray-200">
                      {headerGroup.headers.map((header) => {
                        const columnSize = header.column.columnDef.size;
                        
                        return (
                          <TableHead
                            key={header.id}
                            className="py-3 px-4 text-gray-700 font-semibold text-sm"
                            style={{ 
                              width: columnSize ? `${columnSize}px` : 'auto',
                              minWidth: columnSize ? `${columnSize}px` : 'auto'
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row, index) => (
                      <TableRow 
                        key={row.id} 
                        className={`border-b border-gray-100 ${
                          index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-red-50/10 hover:bg-red-50/20'
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => {
                          const columnSize = cell.column.columnDef.size;
                          return (
                            <TableCell 
                              key={cell.id} 
                              className="py-3 px-4 text-sm"
                              style={{ 
                                width: columnSize ? `${columnSize}px` : 'auto',
                                minWidth: columnSize ? `${columnSize}px` : 'auto'
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-64 text-center"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="p-4 rounded-full bg-gray-100">
                            <Building2 className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="text-gray-500 font-medium">
                            No colleges found
                          </div>
                          <div className="text-gray-400 text-sm">
                            {searchQuery 
                              ? "No results match your search" 
                              : "Get started by adding your first college"}
                          </div>
                          {!searchQuery && (
                            <Button
                              onClick={openAddDialog}
                              className="mt-3 bg-red-600 hover:bg-red-700"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add College
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination Section */}
          <div className="p-4">
            <CustomPagination />
          </div>
        </Card>
      </div>

      {/* Add/Edit College Dialog */}
      <AddEditCollege
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        college={selectedCollege}
        colleges={colleges}
        onSuccess={handleModalSuccess}
      />

      {/* Delete College Dialog */}
      <DeleteCollege
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        collegeName={collegeToDelete?.name || ""}
        collegeCode={collegeToDelete?.code || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default CollegesPage;