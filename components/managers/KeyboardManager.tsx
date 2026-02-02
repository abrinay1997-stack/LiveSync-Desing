import { useEffect } from 'react';
import { useStore } from '../../store';

export const KeyboardManager = () => {
    const setTool = useStore(state => state.setTool);
    const setViewMode = useStore(state => state.setViewMode);
    const removeObject = useStore(state => state.removeObject);
    const selectedIds = useStore(state => state.selectedIds);
    const clearSelection = useStore(state => state.clearSelection);
    const viewMode = useStore(state => state.viewMode);
    const undo = useStore(state => state.undo);
    const redo = useStore(state => state.redo);
    const cancelCable = useStore(state => state.cancelCable);
    const pendingCableStartId = useStore(state => state.pendingCableStartId);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Undo/Redo Logic
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            // Tools
            switch(e.key.toLowerCase()) {
                case 'v': setTool('select'); break;
                case 'g': setTool('move'); break;
                case 'r': setTool('rotate'); break;
                case 'c': setTool('cable'); break; // Add Shortcut for Cable
                case 'escape': 
                    if (pendingCableStartId) {
                        cancelCable();
                    } else {
                        clearSelection(); 
                    }
                    break;
                case 'delete': 
                case 'backspace':
                    selectedIds.forEach(id => removeObject(id));
                    break;
                case 't': setViewMode(viewMode === 'top' ? 'perspective' : 'top'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setTool, setViewMode, removeObject, selectedIds, clearSelection, viewMode, undo, redo, cancelCable, pendingCableStartId]);

    return null;
};