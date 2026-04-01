import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, DOC_TYPE_LABELS } from "@/const";
import { FileText, Plus, Trash2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "artwork", label: "Artwork" },
  { value: "antique", label: "Antiques" },
  { value: "jewelry", label: "Jewelry" },
  { value: "furniture", label: "Furniture" },
  { value: "collectible", label: "Collectibles" },
  { value: "other", label: "Other" },
];

const DOC_TYPES = [
  { value: "certificate_of_authenticity", label: "Certificate of Authenticity" },
  { value: "appraisal", label: "Appraisal Report" },
  { value: "provenance", label: "Provenance Record" },
  { value: "other", label: "Other Document" },
];

export default function Sell() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("artwork");
  const [startingPrice, setStartingPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [endDays, setEndDays] = useState("7");
  const [createdItemId, setCreatedItemId] = useState<number | null>(null);

  // Document upload state
  const [docType, setDocType] = useState("certificate_of_authenticity");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; type: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const createItem = trpc.items.create.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Listing created successfully!");
      utils.items.mySelling.invalidate();
      // Get the created item id by refetching
      utils.items.mySelling.fetch().then((items) => {
        if (items && items.length > 0) {
          const latest = items[0];
          setCreatedItemId(latest.id);
        }
      });
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadDoc = trpc.documents.upload.useMutation({
    onSuccess: (data) => {
      toast.success("Document uploaded!");
      setUploadedDocs((prev) => [
        ...prev,
        { name: docFile?.name ?? "document", type: docType, url: data.url },
      ]);
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startingPrice || !category) {
      toast.error("Please fill in all required fields");
      return;
    }
    const endTime = Date.now() + parseInt(endDays) * 86400000;
    createItem.mutate({
      title,
      description: description || undefined,
      category: category as "artwork" | "antique" | "jewelry" | "furniture" | "collectible" | "other",
      startingPrice: parseFloat(startingPrice),
      imageUrl: imageUrl || undefined,
      endTime,
    });
  };

  const handleDocUpload = async () => {
    if (!docFile || !createdItemId) {
      toast.error("Please create the listing first, then upload documents.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      uploadDoc.mutate({
        itemId: createdItemId,
        docType: docType as "certificate_of_authenticity" | "appraisal" | "provenance" | "other",
        fileName: docFile.name,
        fileBase64: base64,
        mimeType: docFile.type || "application/pdf",
      });
    };
    reader.readAsDataURL(docFile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-black mb-4">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">Please sign in to list an item.</p>
            <Button
              className="bg-primary text-primary-foreground font-bold uppercase tracking-wider"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="border-b border-foreground/10">
        <div className="container py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-primary" aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Seller
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">List an Item</h1>
        </div>
      </div>

      <div className="container py-10 flex-1">
        <div className="max-w-2xl">
          {!createdItemId ? (
            <form onSubmit={handleCreate} className="space-y-6">
              {/* Title */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Title *
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Original Oil Painting by Kenyan Artist"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Description
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item, its history, condition, and any notable features..."
                  rows={4}
                />
              </div>

              {/* Category */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Category *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Starting price */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Starting Price (KES) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    KES
                  </span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value)}
                    placeholder="5000"
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Image URL
                </Label>
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="mt-2 h-32 w-auto object-cover border border-border"
                    onError={() => setImageUrl("")}
                  />
                )}
              </div>

              {/* Auction duration */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                  Auction Duration
                </Label>
                <Select value={endDays} onValueChange={setEndDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      { value: "1", label: "1 Day" },
                      { value: "3", label: "3 Days" },
                      { value: "7", label: "7 Days" },
                      { value: "14", label: "14 Days" },
                      { value: "30", label: "30 Days" },
                    ].map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={createItem.isPending}
                className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-wider h-12"
              >
                {createItem.isPending ? "Creating..." : "Create Listing"}
              </Button>
            </form>
          ) : (
            <div className="space-y-8">
              {/* Success */}
              <div className="border border-primary p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold">✓</span>
                  </div>
                  <h2 className="font-black text-lg">Listing Created!</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Your item has been listed. Now upload authenticity documents to increase buyer confidence.
                </p>
                <Button asChild variant="outline" className="font-bold uppercase tracking-wider">
                  <a href={`/items/${createdItemId}`}>View Listing</a>
                </Button>
              </div>

              {/* Document upload */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="font-black text-base">Upload Authenticity Documents</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Upload certificates of authenticity, appraisal reports, or provenance records.
                  These are stored securely and displayed to potential buyers.
                </p>

                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                      Document Type
                    </Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                      File (PDF, JPG, PNG — max 5MB)
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:border file:border-foreground/20 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-background file:text-foreground hover:file:bg-muted"
                    />
                  </div>

                  <Button
                    onClick={handleDocUpload}
                    disabled={!docFile || uploadDoc.isPending}
                    className="bg-primary text-primary-foreground font-bold uppercase tracking-wider gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadDoc.isPending ? "Uploading..." : "Upload Document"}
                  </Button>
                </div>

                {/* Uploaded docs list */}
                {uploadedDocs.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Uploaded Documents
                    </p>
                    {uploadedDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-border">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {DOC_TYPE_LABELS[doc.type] ?? doc.type}
                          </p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-bold"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
