import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SessionFormData, SessionStatus } from "../types";

interface SessionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Partial<SessionFormData>;
  onFormChange: (data: Partial<SessionFormData>) => void;
  onSubmit: () => void;
  title: string;
  description: string;
  submitLabel: string;
}

const SESSION_STATUSES: SessionStatus[] = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELED"];

export function SessionFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  title,
  description,
  submitLabel,
}: SessionFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              value={formData.roomName || ""}
              onChange={(e) => onFormChange({ ...formData, roomName: e.target.value })}
              placeholder="Enter room name (optional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="number"
              value={formData.userId || ""}
              onChange={(e) =>
                onFormChange({ ...formData, userId: parseInt(e.target.value) || undefined })
              }
              placeholder="Enter user ID"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="userId2">Mentor ID</Label>
            <Input
              id="userId2"
              type="number"
              value={formData.userId2 || ""}
              onChange={(e) =>
                onFormChange({ ...formData, userId2: parseInt(e.target.value) || undefined })
              }
              placeholder="Enter mentor ID"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || "SCHEDULED"}
              onValueChange={(value) =>
                onFormChange({ ...formData, status: value as SessionStatus })
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {SESSION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
