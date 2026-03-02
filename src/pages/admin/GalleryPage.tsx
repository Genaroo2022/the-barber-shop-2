import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type {
  GalleryImageResponse,
  AdminGalleryImageUpsertRequest,
  AdminGalleryUploadResponse,
  AdminGalleryUploadSignatureResponse,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Label } from "@/components/ui/label";

interface SortOrderConflictState {
  conflictingImage: GalleryImageResponse;
  payload: AdminGalleryImageUpsertRequest;
  previousSortOrder: number;
}

export default function GalleryPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryImageResponse | null>(null);
  const [imageToDelete, setImageToDelete] = useState<GalleryImageResponse | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [sortOrderConflict, setSortOrderConflict] = useState<SortOrderConflictState | null>(null);
  const [form, setForm] = useState<AdminGalleryImageUpsertRequest>({ title: "", imageUrl: "", sortOrder: 0, active: true });
  const [initialSortOrder, setInitialSortOrder] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const batchUploadInputRef = useRef<HTMLInputElement | null>(null);

  const { data: images } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => api.get<GalleryImageResponse[]>("/api/admin/gallery"),
  });

  const sortedImages = useMemo(
    () => [...(images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [images],
  );

  useEffect(() => {
    if (!images) {
      setSelectedImageIds([]);
      return;
    }
    const validIds = new Set(images.map((img) => img.id));
    setSelectedImageIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [images]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/gallery/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast({ title: "Imagen eliminada" });
    },
    onError: (err: Error) => {
      const msg = err instanceof ApiError ? err.message : "No se pudo eliminar la imagen";
      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const getNextSortOrder = () => {
    if (!images || images.length === 0) return 1;
    return Math.max(...images.map((img) => img.sortOrder)) + 1;
  };

  const mapImageToPayload = (image: GalleryImageResponse): AdminGalleryImageUpsertRequest => ({
    title: image.title,
    category: image.category ?? undefined,
    imageUrl: image.imageUrl,
    sortOrder: image.sortOrder,
    active: image.active,
  });

  const saveGalleryImage = (payload: AdminGalleryImageUpsertRequest, imageId?: string) => {
    if (imageId) {
      return api.put(`/api/admin/gallery/${imageId}`, payload);
    }
    return api.post("/api/admin/gallery", payload);
  };

  const sanitizePayload = (payload: AdminGalleryImageUpsertRequest): AdminGalleryImageUpsertRequest => ({
    ...payload,
    title: payload.title.trim(),
    category: payload.category?.trim() || undefined,
    imageUrl: payload.imageUrl.trim(),
    sortOrder: Number(payload.sortOrder),
  });

  const finalizeSave = async (payload: AdminGalleryImageUpsertRequest) => {
    setSaving(true);
    try {
      await saveGalleryImage(payload, editing?.id);
      await qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      setDialogOpen(false);
      setEditing(null);
      setSortOrderConflict(null);
      toast({ title: editing ? "Imagen actualizada" : "Imagen creada" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "No se pudo guardar la imagen";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new ApiError("El archivo debe ser una imagen", 400);
    }

    const signature = await api.get<AdminGalleryUploadSignatureResponse>("/api/admin/gallery/upload-signature");
    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("api_key", signature.apiKey);
    uploadData.append("timestamp", String(signature.timestamp));
    uploadData.append("signature", signature.signature);
    uploadData.append("folder", signature.folder);
    uploadData.append("public_id", signature.publicId);

    try {
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        let cloudinaryError = "No se pudo subir la imagen a Cloudinary";
        try {
          const errData = (await uploadResponse.json()) as { error?: { message?: string } };
          if (errData.error?.message) {
            cloudinaryError = errData.error.message;
          }
        } catch {
          // ignore parse errors and keep generic message
        }
        throw new ApiError(cloudinaryError, uploadResponse.status);
      }

      const data = (await uploadResponse.json()) as AdminGalleryUploadResponse & { secure_url?: string };
      const imageUrl = data.imageUrl || data.secure_url;
      if (!imageUrl) {
        throw new ApiError("Cloudinary no devolvio URL de imagen", 500);
      }

      return imageUrl;
    } catch (err) {
      const fd = new FormData();
      fd.append("file", file);
      const fallback = await api.postForm<AdminGalleryUploadResponse>("/api/admin/gallery/upload", fd);
      if (!fallback.imageUrl) {
        const directMsg = err instanceof ApiError ? err.message : "Error al subir imagen";
        throw new ApiError(directMsg, 500);
      }
      return fallback.imageUrl;
    }
  };

  const getTitleFromFileName = (fileName: string): string => {
    const sanitized = fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!sanitized) {
      return `Imagen ${Date.now()}`;
    }

    return sanitized.length >= 2 ? sanitized.slice(0, 120) : `Imagen ${Date.now()}`;
  };

  const handleBatchUpload = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setUploading(true);
    let nextSortOrder = getNextSortOrder();
    let createdCount = 0;
    let errorCount = 0;

    try {
      for (const file of files) {
        try {
          const imageUrl = await uploadImageFile(file);
          const payload: AdminGalleryImageUpsertRequest = {
            title: getTitleFromFileName(file.name),
            imageUrl,
            sortOrder: nextSortOrder,
            active: true,
          };
          await saveGalleryImage(payload);
          createdCount += 1;
          nextSortOrder += 1;
        } catch {
          errorCount += 1;
        }
      }

      await qc.invalidateQueries({ queryKey: ["admin-gallery"] });

      if (createdCount > 0 && errorCount === 0) {
        toast({ title: `${createdCount} imagen(es) subidas` });
      } else if (createdCount > 0 && errorCount > 0) {
        toast({
          title: "Carga parcial completada",
          description: `${createdCount} imagen(es) subidas y ${errorCount} con error.`,
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo subir ninguna imagen.",
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
      if (batchUploadInputRef.current) {
        batchUploadInputRef.current.value = "";
      }
    }
  };

  const handleSingleUpload = async (file: File) => {
    setUploading(true);
    try {
      const imageUrl = await uploadImageFile(file);
      setForm((prev) => ({ ...prev, imageUrl }));
      toast({ title: "Imagen subida" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al subir imagen";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    const nextSortOrder = getNextSortOrder();
    setEditing(null);
    setForm({ title: "", imageUrl: "", sortOrder: nextSortOrder, active: true });
    setInitialSortOrder(nextSortOrder);
    setSortOrderConflict(null);
    setDialogOpen(true);
  };

  const openEdit = (img: GalleryImageResponse) => {
    setEditing(img);
    setForm({
      title: img.title,
      category: img.category || undefined,
      imageUrl: img.imageUrl,
      sortOrder: img.sortOrder,
      active: img.active,
    });
    setInitialSortOrder(img.sortOrder);
    setSortOrderConflict(null);
    setDialogOpen(true);
  };

  const toggleSelection = (imageId: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId],
    );
  };

  const selectAll = () => {
    setSelectedImageIds(sortedImages.map((img) => img.id));
  };

  const clearSelection = () => {
    setSelectedImageIds([]);
  };

  const isValidImageUrl = (() => {
    try {
      if (!form.imageUrl.trim()) return false;
      const url = new URL(form.imageUrl);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  })();

  const isGalleryFormValid =
    form.title.trim().length >= 2 &&
    form.title.trim().length <= 120 &&
    (form.category?.length ?? 0) <= 60 &&
    form.imageUrl.length <= 500 &&
    isValidImageUrl &&
    Number.isInteger(form.sortOrder) &&
    form.sortOrder >= 0;

  const selectedCount = selectedImageIds.length;
  const allSelected = sortedImages.length > 0 && selectedCount === sortedImages.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">{images?.length ?? 0} imagenes</p>
        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={allSelected ? clearSelection : selectAll}>
                {allSelected ? "Quitar seleccion" : "Seleccionar todas"}
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 size={14} className="mr-1" /> Eliminar seleccionadas ({selectedCount})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => batchUploadInputRef.current?.click()}>
            {uploading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />} Subir varias
          </Button>
          <input
            ref={batchUploadInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleBatchUpload(e.target.files)}
          />
          <Button onClick={openNew} size="sm">
            <Plus size={14} className="mr-1" /> Nueva imagen
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedImages.map((img) => {
          const selected = selectedImageIds.includes(img.id);
          return (
            <div
              key={img.id}
              className={`relative group rounded-xl overflow-hidden border ${img.active ? "border-border" : "border-border opacity-50"}`}
            >
              <button
                type="button"
                onClick={() => toggleSelection(img.id)}
                className={`absolute left-2 top-2 z-10 h-6 w-6 rounded border text-xs font-medium transition-colors ${
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/85 text-foreground"
                }`}
                aria-label={selected ? "Quitar imagen de la seleccion" : "Seleccionar imagen"}
              >
                {selected ? "X" : ""}
              </button>

              <img src={img.imageUrl} alt={img.title} className="w-full aspect-square object-cover" loading="lazy" />

              <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => openEdit(img)} className="p-2 bg-card rounded-lg hover:bg-primary/20 transition-colors">
                  <Pencil size={16} className="text-primary" />
                </button>
                <button
                  onClick={() => setImageToDelete(img)}
                  className="p-2 bg-card rounded-lg hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 size={16} className="text-destructive" />
                </button>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2">
                <p className="text-xs text-foreground truncate">#{img.sortOrder} - {img.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSortOrderConflict(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar imagen" : "Nueva imagen"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Titulo"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              minLength={2}
              maxLength={120}
              className="bg-background"
            />
            <Input
              placeholder="Categoria (opcional)"
              value={form.category || ""}
              onChange={(e) => setForm({ ...form, category: e.target.value || undefined })}
              maxLength={60}
              className="bg-background"
            />
            <div>
              <Label className="text-sm text-muted-foreground mb-1 block">Imagen</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="URL de imagen"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="bg-background flex-1"
                />
                <Button variant="outline" size="icon" className="relative" disabled={uploading}>
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && handleSingleUpload(e.target.files[0])}
                  />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gallery-sort-order">Numero de foto</Label>
              <Input
                id="gallery-sort-order"
                type="number"
                placeholder="Orden"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value || 0) })}
                min={0}
                step={1}
                className="bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <span className="text-sm text-muted-foreground">Activa</span>
            </div>
            {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!isGalleryFormValid || saving}
              onClick={() => {
                const payload = sanitizePayload(form);
                const conflictingImage = images?.find(
                  (img) => img.sortOrder === payload.sortOrder && img.id !== editing?.id,
                );

                if (conflictingImage) {
                  setSortOrderConflict({
                    conflictingImage,
                    payload,
                    previousSortOrder: initialSortOrder,
                  });
                  return;
                }

                void finalizeSave(payload);
              }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!imageToDelete}
        onOpenChange={(open) => {
          if (!open) setImageToDelete(null);
        }}
        title="Eliminar imagen"
        description={
          imageToDelete
            ? `Se eliminara la imagen ${imageToDelete.title}. Esta accion no se puede deshacer.`
            : ""
        }
        onConfirm={() => {
          if (!imageToDelete) return;
          deleteMutation.mutate(imageToDelete.id);
          setSelectedImageIds((prev) => prev.filter((id) => id !== imageToDelete.id));
          setImageToDelete(null);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Eliminar imagenes"
        description={`Se eliminaran ${selectedCount} imagenes seleccionadas. Esta accion no se puede deshacer.`}
        onConfirm={async () => {
          const idsToDelete = [...selectedImageIds];
          if (idsToDelete.length === 0) {
            setBulkDeleteOpen(false);
            return;
          }

          const results = await Promise.allSettled(
            idsToDelete.map((id) => api.delete(`/api/admin/gallery/${id}`)),
          );

          const successCount = results.filter((result) => result.status === "fulfilled").length;
          const errorCount = results.length - successCount;

          await qc.invalidateQueries({ queryKey: ["admin-gallery"] });
          setSelectedImageIds([]);
          setBulkDeleteOpen(false);

          if (errorCount === 0) {
            toast({ title: `${successCount} imagen(es) eliminadas` });
            return;
          }

          toast({
            title: "Eliminacion parcial",
            description: `${successCount} imagen(es) eliminadas y ${errorCount} con error.`,
            variant: "destructive",
          });
        }}
      />

      <ConfirmDialog
        open={!!sortOrderConflict}
        onOpenChange={(open) => {
          if (!open) setSortOrderConflict(null);
        }}
        title="Numero de foto en uso"
        description={
          sortOrderConflict
            ? `La foto "${sortOrderConflict.conflictingImage.title}" ya usa el numero ${sortOrderConflict.payload.sortOrder}. Si continuas, se intercambiaran los numeros de ambas fotos.`
            : ""
        }
        confirmLabel="Continuar e intercambiar"
        cancelLabel="Cancelar"
        onConfirm={async () => {
          if (!sortOrderConflict) return;

          const conflictingImagePayload: AdminGalleryImageUpsertRequest = {
            ...mapImageToPayload(sortOrderConflict.conflictingImage),
            sortOrder: sortOrderConflict.previousSortOrder,
          };

          setSaving(true);
          try {
            await saveGalleryImage(conflictingImagePayload, sortOrderConflict.conflictingImage.id);
            await saveGalleryImage(sortOrderConflict.payload, editing?.id);
            await qc.invalidateQueries({ queryKey: ["admin-gallery"] });
            setDialogOpen(false);
            setEditing(null);
            setSortOrderConflict(null);
            toast({ title: "Intercambio aplicado" });
          } catch (err) {
            const msg = err instanceof ApiError ? err.message : "No se pudo intercambiar el numero de foto";
            toast({ title: "Error", description: msg, variant: "destructive" });
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
