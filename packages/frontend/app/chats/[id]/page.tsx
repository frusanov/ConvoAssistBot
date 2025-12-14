"use client";

import { api } from "@/api-sdk";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();

  const [chat, setChat] = useState<any | null>(null);

  useEffect(() => {
    api.getChat(id).then(({ data }) => setChat(data));
  }, [id]);

  return (
    <div>
      <Link href={`/`}>Back</Link>
      <div>
        {chat && (
          <>
            <Item>
              <ItemContent>
                <ItemTitle>Transcribe</ItemTitle>
                <ItemDescription>Item</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch defaultChecked={chat?.settings?.transcribe} />
              </ItemActions>
            </Item>

            <Item>
              <ItemContent>
                <ItemTitle>Summarize</ItemTitle>
                <ItemDescription>Item</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch defaultChecked={chat?.settings?.summarize} />
              </ItemActions>
              <ItemFooter className="flex-col gap-4">
                <div className="w-full flex flex-col gap-1">
                  <Label htmlFor="settings-time-input">Time</Label>
                  <Input id="settings-time-input" />
                </div>
                <div className="w-full flex flex-col gap-1">
                  <Label htmlFor="settings-amount-input">
                    Messages to store
                  </Label>
                  <Input id="settings-amount-input" />
                </div>
              </ItemFooter>
            </Item>
          </>
        )}
        <pre>{JSON.stringify(chat, null, 2)}</pre>
      </div>
    </div>
  );
}
