import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Streamdown } from "streamdown";
import { MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotWidgetProps {
  itemId?: number;
}

export function ChatbotWidget({ itemId }: ChatbotWidgetProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm the **ArtBid Assistant**. I can help you with bidding, M-Pesa payments, auction rules, and more. How can I help you today?",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = trpc.chatbot.message.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessage.isPending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    sendMessage.mutate({
      message: userMsg,
      history: messages.slice(-10).map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "",
      })),
      itemId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 w-80 bg-background border border-foreground/20 shadow-xl flex flex-col",
            minimized ? "h-14" : "h-[480px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-foreground text-background shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-primary flex items-center justify-center">
                <MessageCircle className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider">ArtBid Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1 hover:bg-background/10 transition-colors"
                aria-label="Minimize"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-background/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground border border-border"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Streamdown className="prose prose-sm max-w-none [&_p]:mb-1 [&_p:last-child]:mb-0">
                          {msg.content}
                        </Streamdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border px-3 py-2 text-sm text-muted-foreground">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-foreground/10 flex gap-2 shrink-0">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="text-sm"
                  disabled={sendMessage.isPending}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className="bg-primary text-primary-foreground shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
