"use client";

import { FC } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useAuth } from "../providers/auth";

export const Header: FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-4 flex justify-between">
      <h1 className="font-black">ConvoAssistBot</h1>
      <Avatar>
        <AvatarImage src={user.photo_url} alt={user.username} />
      </Avatar>
    </div>
  );
};
