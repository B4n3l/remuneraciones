import { supabase } from './supabase';

export async function uploadWorkerDocument(
    workerId: string,
    file: Buffer | Blob,
    fileName: string,
    mimeType: string = 'application/pdf'
) {
    const bucket = 'worker-documents';
    const filePath = `${workerId}/${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        throw new Error(`Error al subir archivo a Supabase: ${error.message}`);
    }

    return {
        path: data.path,
        fullUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`
    };
}

export async function getDownloadUrl(path: string) {
    const bucket = 'worker-documents';
    const { data } = await supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

export async function getWorkerDocumentSignedUrl(path: string, expiresIn: number = 60) {
    const bucket = 'worker-documents';
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

    if (error) {
        throw new Error(`Error al firmar URL de descarga: ${error.message}`);
    }

    return data.signedUrl;
}
