"use client";

import { api } from "@/api-sdk";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/lib/use-fetch";
import { useEffect, useState } from "hono/jsx";

export default function Home() {
  const { fetch } = useFetch();

  const [chats, setChats] = useState<Array<any> | null>(null);

  useEffect(() => {
    api.listChats().then(({ data }) => {
      setChats(data);
    });
  }, []);

  // const onClick = () => {
  //   fetch("/api/chats", {
  //     method: "GET",
  //   })
  //     .then((r) => r.json())
  //     .then((data) => {
  //       alert(data?.message);
  //     });
  // };

  return (
    <div>
      {/*<Button onClick={onClick}>Click me</Button>*/}
      {chats?.map?.((chat) => <>{chat.id}</>)}
    </div>
  );
}
