"use client";

import { api } from "@/api-sdk";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [chats, setChats] = useState<Array<{
    id: string;
    title: string | null;
    type: string;
  }> | null>(null);

  useEffect(() => {
    api.listChats().then(({ data }) => {
      setChats(data);
    });
  }, []);

  return (
    <div>
      {chats?.map?.((chat) => (
        <div key={chat.id}>
          <Link
            className="p-4 flex align-middle gap-2 cursor-pointer hover:bg-blue-50"
            href={`/chats/${chat.id}`}
          >
            <div>{chat.title || chat.id}</div>
            <div className="text-xs rounded-4xl border px-2 py-1 border-blue-200">
              {chat.type}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
