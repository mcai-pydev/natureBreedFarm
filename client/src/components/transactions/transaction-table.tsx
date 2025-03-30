import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionWithProduct } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, Loader2, Trash } from "lucide-react";

// Pagination settings
const ITEMS_PER_PAGE = 10;

interface TransactionTableProps {
  transactions: TransactionWithProduct[];
  isLoading: boolean;
}

export default function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithProduct | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  
  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete transaction",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle delete confirmation
  const handleDelete = () => {
    if (selectedTransaction) {
      deleteTransactionMutation.mutate(selectedTransaction.id);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer/Supplier</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : paginatedTransactions.length > 0 ? (
              // Transaction data
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(new Date(transaction.date))}</TableCell>
                  <TableCell>{transaction.product.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      transaction.type === "sale" 
                        ? "success" 
                        : transaction.type === "purchase" 
                          ? "destructive" 
                          : "outline"
                    }>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.customer || "-"}</TableCell>
                  <TableCell>{transaction.quantity} {transaction.product.unit}</TableCell>
                  <TableCell>
                    {transaction.type === "purchase" ? "- " : ""}
                    {formatCurrency(transaction.price * transaction.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        toast({
                          title: "Edit not implemented",
                          description: "Editing transactions is not available in this version.",
                        });
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  No transactions found. Create your first transaction using the form above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {transactions.length > ITEMS_PER_PAGE && (
        <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(startIndex + ITEMS_PER_PAGE, transactions.length)}
                </span>{" "}
                of <span className="font-medium">{transactions.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-md"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "outline"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-r-md"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transaction and may affect your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTransactionMutation.isPending}
            >
              {deleteTransactionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
