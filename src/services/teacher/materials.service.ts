import { supabase } from '@/lib/supabase';
import { StudyMaterial, StudyMaterialCategory } from '@/types/teacher';
import { STORAGE_KEYS, getStored, setStored } from './storage.keys';
import { batchesService } from './batches.service';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectFileType(fileName: string, mimeType?: string): 'pdf' | 'image' | 'doc' | 'other' {
  const lowerName = fileName.toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  if (lowerName.endsWith('.pdf') || lowerMime.includes('pdf')) {
    return 'pdf';
  }
  if (
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.webp') ||
    lowerMime.startsWith('image/')
  ) {
    return 'image';
  }
  if (
    lowerName.endsWith('.doc') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.ppt') ||
    lowerName.endsWith('.pptx') ||
    lowerName.endsWith('.txt') ||
    lowerMime.includes('word') ||
    lowerMime.includes('presentation')
  ) {
    return 'doc';
  }
  return 'other';
}

export class MaterialsService {
  /**
   * Get all study materials across all batches
   */
  async getAllMaterials(): Promise<StudyMaterial[]> {
    let localMaterials = await getStored<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, []);

    // Purge any previously stored sample / dummy materials
    const cleaned = localMaterials.filter(
      (m) => !m.id.startsWith('mat-sample-') && !m.fileUrl.includes('dummy.pdf'),
    );
    if (cleaned.length !== localMaterials.length) {
      localMaterials = cleaned;
      await setStored(STORAGE_KEYS.MATERIALS, localMaterials);
    }

    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const batches = await batchesService.getBatches();
        const batchMap = new Map(batches.map((b) => [b.id, b]));

        const supabaseMapped: StudyMaterial[] = data.map((item) => {
          const b = batchMap.get(item.batch_id);
          return {
            id: item.id,
            batchId: item.batch_id,
            batchName: b?.name || 'Class Batch',
            teacherId: item.teacher_id || undefined,
            title: item.title,
            description: item.description || undefined,
            subject: item.subject,
            category: (item.category as StudyMaterialCategory) || 'notes',
            fileUrl: item.file_url,
            fileName: item.file_name,
            fileSize: item.file_size || undefined,
            fileType: (item.file_type as any) || detectFileType(item.file_name),
            createdAt: item.created_at,
          };
        });

        const supabaseIds = new Set(supabaseMapped.map((m) => m.id));
        const unsyncedLocal = localMaterials.filter((m) => !supabaseIds.has(m.id));
        const merged = [...supabaseMapped, ...unsyncedLocal];

        await setStored(STORAGE_KEYS.MATERIALS, merged);
        return merged;
      }
    } catch (e) {
      console.warn('MaterialsService: Supabase fetch error, fallback to local:', e);
    }

    return localMaterials;
  }

  /**
   * Get materials for a specific batch
   */
  async getMaterialsByBatch(batchId: string): Promise<StudyMaterial[]> {
    const all = await this.getAllMaterials();
    return all.filter((m) => m.batchId === batchId);
  }

  /**
   * Upload or add a new study material
   */
  async createMaterial(
    data: {
      batchId: string;
      title: string;
      description?: string;
      subject: string;
      category: StudyMaterialCategory;
    },
    pickedFile: {
      uri: string;
      name: string;
      size?: number;
      mimeType?: string;
    },
  ): Promise<StudyMaterial> {
    const batches = await batchesService.getBatches();
    const batch = batches.find((b) => b.id === data.batchId);
    const batchName = batch ? batch.name : 'Class Batch';

    const fileType = detectFileType(pickedFile.name, pickedFile.mimeType);
    const fileSizeStr = formatBytes(pickedFile.size);
    let finalFileUrl = pickedFile.uri;

    // Optional: Upload to Supabase Storage if bucket is reachable
    try {
      const fileExt = pickedFile.name.split('.').pop() || 'bin';
      const storagePath = `batch_${data.batchId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Check if file can be uploaded via FormData / Blob
      const response = await fetch(pickedFile.uri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(storagePath, blob, {
          contentType: pickedFile.mimeType || 'application/octet-stream',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('study-materials')
          .getPublicUrl(uploadData.path);
        if (publicUrlData?.publicUrl) {
          finalFileUrl = publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      // Graceful fallback to local uri
      console.log('Notice: Uploaded using local device URI:', err);
    }

    const newMaterial: StudyMaterial = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(4, 9)}`,
      batchId: data.batchId,
      batchName,
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      subject: data.subject.trim(),
      category: data.category,
      fileUrl: finalFileUrl,
      fileName: pickedFile.name,
      fileSize: fileSizeStr,
      fileType,
      createdAt: new Date().toISOString(),
      downloadCount: 0,
    };

    // 1. Try Supabase Table insert
    try {
      const { data: insertData, error } = await supabase
        .from('study_materials')
        .insert({
          batch_id: data.batchId,
          title: newMaterial.title,
          description: newMaterial.description || null,
          subject: newMaterial.subject,
          category: newMaterial.category,
          file_url: newMaterial.fileUrl,
          file_name: newMaterial.fileName,
          file_size: newMaterial.fileSize || null,
          file_type: newMaterial.fileType,
        })
        .select()
        .single();

      if (!error && insertData) {
        newMaterial.id = insertData.id;
      }
    } catch (e) {
      console.warn('Notice: study_materials table insert notice (using local):', e);
    }

    // 2. Persist in Local Storage
    const existing = await getStored<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, []);
    const updated = [newMaterial, ...existing];
    await setStored(STORAGE_KEYS.MATERIALS, updated);

    return newMaterial;
  }

  /**
   * Delete study material
   */
  async deleteMaterial(id: string): Promise<void> {
    try {
      await supabase.from('study_materials').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to delete material from Supabase:', e);
    }

    const existing = await getStored<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, []);
    const updated = existing.filter((m) => m.id !== id);
    await setStored(STORAGE_KEYS.MATERIALS, updated);
  }

  /**
   * Generate a formatted WhatsApp message to notify students about new study material
   */
  formatMaterialWhatsAppMessage(material: StudyMaterial): string {
    const categoryEmoji: Record<StudyMaterialCategory, string> = {
      notes: '📖',
      formula_sheet: '📐',
      question_bank: '📝',
      syllabus: '📋',
      assignment: '📑',
      other: '📁',
    };

    const emoji = categoryEmoji[material.category] || '📚';
    const cleanCategory = material.category.replace('_', ' ').toUpperCase();

    return `*EduFlow - New Study Material Uploaded!* 🎓\n\n` +
      `*Batch:* ${material.batchName}\n` +
      `*Subject:* ${material.subject}\n` +
      `*Category:* ${emoji} ${cleanCategory}\n\n` +
      `📌 *Title:* ${material.title}\n` +
      (material.description ? `💬 *Notes:* ${material.description}\n` : '') +
      `📁 *File:* ${material.fileName} (${material.fileSize || 'PDF'})\n\n` +
      `Students can open and view this material directly in the *EduFlow Student App*!\n\n` +
      `_Keep practicing and learning!_ 🌟`;
  }
}

export const materialsService = new MaterialsService();
