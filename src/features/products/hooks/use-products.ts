/**
 * React Query hooks for Products & BOMs
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CreateBomItemPayload,
  type CreateBomPayload,
  type ListProductsParams,
  type Product,
  type ProductLookups,
  type ProductPayload,
  type UpdateBomPayload,
  type UpdateProductPayload,
  bomsApi,
  productsApi,
} from "../api/products-api";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";

// ============================================================================
// Products
// ============================================================================

export function useProducts(params: ListProductsParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.LIST(params),
    queryFn: () => productsApi.list(params),
  });
}

export function useProduct(id: string | null) {
  return useQuery<Product>({
    queryKey: id ? QUERY_KEYS.PRODUCTS.DETAIL(id) : QUERY_KEYS.PRODUCTS.ALL,
    queryFn: () => {
      if (!id) throw new Error("useProduct requires an id");
      return productsApi.get(id);
    },
    enabled: !!id,
  });
}

export function useProductLookups() {
  return useQuery<ProductLookups>({
    queryKey: QUERY_KEYS.PRODUCTS.LOOKUPS,
    queryFn: () => productsApi.lookups(),
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: (file: File) => productsApi.uploadImage(file),
    onError: (err: Error) => {
      showToast.error("อัปโหลดรูปสินค้าล้มเหลว", err.message);
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductPayload) => productsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      showToast.success("สร้างสินค้าสำเร็จ");
    },
    onError: (err: Error) => {
      showToast.error("สร้างสินค้าล้มเหลว", err.message);
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductPayload }) =>
      productsApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.DETAIL(vars.id) });
      showToast.success("แก้ไขสินค้าสำเร็จ");
    },
    onError: (err: Error) => {
      showToast.error("แก้ไขสินค้าล้มเหลว", err.message);
    },
  });
}

export function useDeactivateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      showToast.success("ปิดใช้งานสินค้าแล้ว");
    },
    onError: (err: Error) => {
      showToast.error("ล้มเหลว", err.message);
    },
  });
}

export function useRestoreProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      showToast.success("กู้คืนสินค้าแล้ว");
    },
    onError: (err: Error) => {
      showToast.error("ล้มเหลว", err.message);
    },
  });
}

// ============================================================================
// BOMs
// ============================================================================

export function useBomsByProduct(productId: string | null) {
  return useQuery({
    queryKey: productId
      ? QUERY_KEYS.BOMS.LIST_BY_PRODUCT(productId)
      : QUERY_KEYS.BOMS.ALL,
    queryFn: () => {
      if (!productId) throw new Error("useBomsByProduct requires a productId");
      return bomsApi.listByProduct(productId);
    },
    enabled: !!productId,
  });
}

export function useBom(id: string | null) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.BOMS.DETAIL(id) : QUERY_KEYS.BOMS.ALL,
    queryFn: () => {
      if (!id) throw new Error("useBom requires an id");
      return bomsApi.get(id);
    },
    enabled: !!id,
  });
}

export function useCreateBom() {
  return useMutation({
    mutationFn: (data: CreateBomPayload) => bomsApi.create(data),
    onSuccess: () => {
      showToast.success("สร้าง BOM สำเร็จ");
    },
    onError: (err: Error) => {
      showToast.error("สร้าง BOM ล้มเหลว", err.message);
    },
  });
}

export function useUpdateBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBomPayload }) =>
      bomsApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOMS.DETAIL(vars.id) });
      showToast.success("แก้ไข BOM สำเร็จ");
    },
    onError: (err: Error) => {
      showToast.error("แก้ไข BOM ล้มเหลว", err.message);
    },
  });
}

export function useAddBomItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bomId, data }: { bomId: string; data: CreateBomItemPayload }) =>
      bomsApi.addItem(bomId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOMS.DETAIL(vars.bomId) });
      showToast.success("เพิ่มวัตถุดิบสำเร็จ");
    },
    onError: (err: Error) => {
      showToast.error("ล้มเหลว", err.message);
    },
  });
}

export function useRemoveBomItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bomId, itemId }: { bomId: string; itemId: string }) =>
      bomsApi.removeItem(bomId, itemId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOMS.DETAIL(vars.bomId) });
      showToast.success("ลบวัตถุดิบแล้ว");
    },
    onError: (err: Error) => {
      showToast.error("ล้มเหลว", err.message);
    },
  });
}

export function useActivateBom() {
  return useMutation({
    mutationFn: (id: string) => bomsApi.activate(id),
    onSuccess: () => showToast.success("เปิดใช้งาน BOM แล้ว"),
    onError: (err: Error) => {
      showToast.error("ล้มเหลว", err.message);
    },
  });
}

export function useDeactivateBom() {
  return useMutation({
    mutationFn: (id: string) => bomsApi.deactivate(id),
    onSuccess: () => showToast.success("ปิดใช้งาน BOM แล้ว"),
    onError: (err: Error) => {
      showToast.error("ล้มเหลว", err.message);
    },
  });
}

export function useDeleteBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bomsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.BOMS.ALL });
      showToast.success("ลบ BOM แล้ว");
    },
    onError: (err: Error) => {
      showToast.error("ล้มเหลว", err.message);
    },
  });
}
