import { useEffect } from 'react';
import { useStore } from '../../store';

export const KeyboardManager = () => {
    const setTool = useStore(state => state.setTool);
    const setViewMode = useStore(state => state.setViewMode);
    const removeObject = useStore(state => state.removeObject);
    const selectedIds = useStore(state => state.selectedIds);
    const clearSelection = useStore(state => state.clearSelection);
    const viewMode = useStore(state => state.viewMode);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch(e.key.toLowerCase()) {
                case 'v': setTool('select'); break;
                case 'g': setTool('move'); break;
                case 'r': setTool('rotate'); break;
                case 'escape': clearSelection(); break;
                case 'delete': 
                case 'backspace':
                    selectedIds.forEach(id => removeObject(id));
                    break;
                case 't': setViewMode(viewMode === 'top' ? 'perspective' : 'top'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setTool, setViewMode, removeObject, selectedIds, clearSelection, viewMode]);

    return null;
};