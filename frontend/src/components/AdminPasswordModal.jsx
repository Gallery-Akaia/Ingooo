import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AdminPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password === "8890") {
      // Store password verification in session storage
      sessionStorage.setItem("admin_password_verified", "true");
      toast.success("Admin access granted");
      onSuccess();
      onClose();
      setPassword("");
    } else {
      setError("Incorrect password. Please try again.");
      toast.error("Incorrect password");
    }

    setIsLoading(false);
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onClose();
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#1a1a1d] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Admin Access Required</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-password" className="text-gray-300">
              Enter admin password
            </Label>
            <Input
              id="admin-password"
              data-testid="admin-password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="bg-[#0a0a0b] border-white/20 text-white placeholder:text-gray-500 focus:border-orange-500"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm" data-testid="password-error">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              data-testid="admin-access-submit-button"
              type="submit"
              className="flex-1 btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Access Admin Panel"}
            </Button>
            <Button
              data-testid="admin-access-cancel-button"
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPasswordModal;