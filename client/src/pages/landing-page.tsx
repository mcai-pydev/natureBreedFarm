import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, Users, ShoppingBag, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Leaf className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">Nature Breed Farm</span>
            <span className="block text-primary">Management System</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            A comprehensive platform to streamline farm operations and connect customers with premium farm products.
          </p>
        </div>

        {/* Main content - choose interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Admin Interface Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition duration-500 hover:scale-105">
            <div className="p-8">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Farm Administration</h2>
              <p className="text-gray-600 mb-8">
                Manage inventory, track breeding programs, process transactions, and view comprehensive analytics for your farm operation.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/admin")}
              >
                Access Admin Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Customer Interface Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition duration-500 hover:scale-105">
            <div className="p-8">
              <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Online Shop</h2>
              <p className="text-gray-600 mb-8">
                Browse farm products, place orders, learn about our sustainable farming practices, and connect with our farm community.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate("/shop")}
              >
                Visit Online Shop
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-gray-500">
            © {new Date().getFullYear()} Nature Breed Farm. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}