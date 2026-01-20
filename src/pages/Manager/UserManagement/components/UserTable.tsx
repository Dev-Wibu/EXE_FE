import { Edit, Power, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { User, UserRole } from "../types";

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const getRoleBadgeClass = (role?: UserRole): string => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-600 hover:bg-purple-600";
    case "STAFF":
      return "bg-blue-600 hover:bg-blue-600";
    case "MENTOR":
      return "bg-orange-500 hover:bg-orange-500";
    default:
      return "bg-gray-500 hover:bg-gray-500";
  }
};

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Search className="h-12 w-12 text-gray-400" />
        <p className="font-['Inter'] text-lg text-gray-500">Không tìm thấy người dùng nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Tên</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="w-24">Vai trò</TableHead>
          <TableHead>Trường đại học</TableHead>
          <TableHead>Chuyên ngành</TableHead>
          <TableHead className="w-24">Trạng thái</TableHead>
          <TableHead className="w-24 text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.id}</TableCell>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              <Badge variant="default" className={`text-white ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs truncate">{user.university || "-"}</TableCell>
            <TableCell>{user.major || "-"}</TableCell>
            <TableCell>
              <Badge variant={user.isActive !== false ? "default" : "destructive"}>
                {user.isActive !== false ? "Hoạt động" : "Ngưng hoạt động"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(user)}
                  className="h-8 w-8 p-0 hover:bg-blue-50"
                  title="Chỉnh sửa">
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(user)}
                  className={`h-8 w-8 p-0 ${user.isActive !== false ? "hover:bg-red-50" : "hover:bg-green-50"}`}
                  title={user.isActive !== false ? "Vô hiệu hóa" : "Kích hoạt"}>
                  <Power
                    className={`h-4 w-4 ${user.isActive !== false ? "text-red-600" : "text-green-600"}`}
                  />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
