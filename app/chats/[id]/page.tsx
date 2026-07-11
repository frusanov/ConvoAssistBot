"use client";

import { useEffect, useState } from "react";
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
import { useForm } from "react-hook-form";
import { ChatSetings } from "@/types/chats";
import { Button } from "@/components/ui/button";

export function ChatPagePreloader() {}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();

  const form = useForm<ChatSetings>({
    defaultValues: async () => {
      return await api.getChat(id).then(({ data }) => {
        return data.settings;
      });
    },
  });

  const { register, formState, handleSubmit } = form;
  const { isLoading } = formState;

  const [debugData, setDebugData] = useState({});

  const onSubmit = handleSubmit(
    async (values) => {
      alert(JSON.stringify(values, null, 2));
      console.log({ values });
      setDebugData(values);
    },
    (e) => {
      throw e;
    },
  );

  return (
    <div>
      <Link href={`/`}>Back</Link>
      <div>
        {!isLoading && (
          <form onSubmit={onSubmit}>
            <Item>
              <ItemContent>
                <ItemTitle>Transcribe</ItemTitle>
                <ItemDescription>Item</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch {...register("transcribe", {})} />
              </ItemActions>
            </Item>

            <Item>
              <ItemContent>
                <ItemTitle>Summarize</ItemTitle>
                <ItemDescription>Item</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Switch {...register("summarize", {})} />
              </ItemActions>
              <ItemFooter className="flex-col gap-4">
                <div className="w-full flex flex-col gap-1">
                  <Label htmlFor="settings-time-input">Time</Label>
                  <Input
                    id="settings-time-input"
                    type="number"
                    {...register("storeMessages.time", {
                      required: true,
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="w-full flex flex-col gap-1">
                  <Label htmlFor="settings-amount-input">
                    Messages to store
                  </Label>
                  <Input
                    id="settings-amount-input"
                    type="number"
                    {...register("storeMessages.amount", {
                      required: true,
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </ItemFooter>
            </Item>

            <Button type="submit">Submit</Button>
          </form>
        )}
        <pre>{JSON.stringify(debugData, null, 2)}</pre>
      </div>
    </div>
  );
}
