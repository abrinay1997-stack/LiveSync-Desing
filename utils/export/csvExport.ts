/**
 * CSV Export Utilities
 *
 * Exports equipment lists, cable schedules, and SPL data
 */

import type { SceneObject, Cable, Layer } from '../../types';
import { ASSETS } from '../../data/library';

interface EquipmentRow {
    name: string;
    model: string;
    type: string;
    quantity: number;
    weight: number;
    totalWeight: number;
    position: string;
    layer: string;
}

interface CableRow {
    id: string;
    type: string;
    from: string;
    to: string;
    length: string;
    color: string;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV<T extends Record<string, any>>(data: T[], headers: (keyof T)[]): string {
    const headerRow = headers.join(',');
    const rows = data.map(row =>
        headers.map(h => {
            const val = row[h];
            // Escape quotes and wrap in quotes if contains comma
            const str = String(val ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    );
    return [headerRow, ...rows].join('\n');
}

/**
 * Generate equipment list from scene objects
 */
export function generateEquipmentList(
    objects: SceneObject[],
    layers: Layer[]
): EquipmentRow[] {
    // Group by model
    const grouped = new Map<string, { objects: SceneObject[]; asset: any }>();

    objects.forEach(obj => {
        const key = obj.model;
        if (!grouped.has(key)) {
            grouped.set(key, { objects: [], asset: ASSETS[obj.model] });
        }
        grouped.get(key)!.objects.push(obj);
    });

    const rows: EquipmentRow[] = [];

    grouped.forEach(({ objects: objs, asset }, model) => {
        const layer = layers.find(l => l.id === objs[0].layerId);
        const weight = asset?.weight || 0;

        rows.push({
            name: asset?.name || model,
            model: model,
            type: objs[0].type,
            quantity: objs.length,
            weight: weight,
            totalWeight: weight * objs.length,
            position: objs.length === 1
                ? `(${objs[0].position[0].toFixed(1)}, ${objs[0].position[1].toFixed(1)}, ${objs[0].position[2].toFixed(1)})`
                : `${objs.length} locations`,
            layer: layer?.name || 'Unknown'
        });
    });

    // Sort by type, then name
    rows.sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
    });

    return rows;
}

/**
 * Export equipment list as CSV
 */
export function exportEquipmentCSV(objects: SceneObject[], layers: Layer[]): string {
    const rows = generateEquipmentList(objects, layers);
    return arrayToCSV(rows, ['name', 'model', 'type', 'quantity', 'weight', 'totalWeight', 'position', 'layer']);
}

/**
 * Generate cable schedule from cables
 */
export function generateCableSchedule(
    cables: Cable[],
    objects: SceneObject[]
): CableRow[] {
    const getObjectName = (id: string): string => {
        const obj = objects.find(o => o.id === id);
        if (!obj) return 'Unknown';
        const asset = ASSETS[obj.model];
        return asset?.name || obj.model;
    };

    return cables.map(cable => ({
        id: cable.id.slice(0, 8),
        type: cable.type,
        from: getObjectName(cable.startObjectId),
        to: getObjectName(cable.endObjectId),
        length: cable.length ? `${cable.length.toFixed(1)}m` : 'N/A',
        color: cable.color
    }));
}

/**
 * Export cable schedule as CSV
 */
export function exportCableScheduleCSV(cables: Cable[], objects: SceneObject[]): string {
    const rows = generateCableSchedule(cables, objects);
    return arrayToCSV(rows, ['id', 'type', 'from', 'to', 'length', 'color']);
}

/**
 * Export SPL grid data as CSV
 */
export function exportSPLGridCSV(
    points: Array<{ position: { x: number; y: number; z: number }; spl: number; quality: string }>
): string {
    const rows = points.map(p => ({
        x: p.position.x.toFixed(2),
        y: p.position.y.toFixed(2),
        z: p.position.z.toFixed(2),
        spl: p.spl.toFixed(1),
        quality: p.quality
    }));
    return arrayToCSV(rows, ['x', 'y', 'z', 'spl', 'quality']);
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Calculate totals for equipment list
 */
export function calculateEquipmentTotals(objects: SceneObject[]): {
    totalItems: number;
    totalWeight: number;
    byType: Record<string, { count: number; weight: number }>;
} {
    const byType: Record<string, { count: number; weight: number }> = {};
    let totalWeight = 0;

    objects.forEach(obj => {
        const asset = ASSETS[obj.model];
        const weight = asset?.weight || 0;
        totalWeight += weight;

        if (!byType[obj.type]) {
            byType[obj.type] = { count: 0, weight: 0 };
        }
        byType[obj.type].count++;
        byType[obj.type].weight += weight;
    });

    return {
        totalItems: objects.length,
        totalWeight,
        byType
    };
}
