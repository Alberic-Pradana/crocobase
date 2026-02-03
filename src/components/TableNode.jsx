import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Key, Fingerprint, GripHorizontal, FileDigit, Type } from 'lucide-react';
import clsx from 'clsx';

import useSchemaStore from '../store/useSchemaStore';

const TableNode = ({ data, selected }) => {
    const cardBgColor = useSchemaStore((state) => state.visualizationSettings.cardBgColor);

    return (
        <div className={clsx(
            "min-w-[250px] rounded-lg border-2 shadow-sm flex flex-col overflow-hidden",
            selected ? "border-blue-500 shadow-md scale-105 transition-transform" : "border-gray-200"
        )}
            style={{ backgroundColor: cardBgColor }}
        >
            {/* Header */}
            <div className="bg-gray-100 p-2 border-b border-gray-200 flex items-center justify-between font-bold text-gray-700 drag-handle">
                <div className="flex items-center gap-2">
                    <GripHorizontal size={14} className="text-gray-400" />
                    <span>{data.name}</span>
                </div>
            </div>

            {/* Columns */}
            <div className="p-2 flex flex-col gap-1">
                {data.columns.map((col, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0 relative group">
                        {/* Left Handle (Target) */}
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`${col.name}-target`}
                            className="!bg-transparent !w-2 !h-full !rounded-none !border-0 !top-[50%] !-left-2 opacity-0 group-hover:opacity-100"
                            style={{ top: '50%', transform: 'translateY(-50%)' }}
                        />

                        <div className="flex items-center gap-2 flex-1">
                            {col.pk && <Key size={14} className="text-yellow-500" />}
                            {col.fk && <Fingerprint size={14} className="text-blue-500" />}
                            {!col.pk && !col.fk && <Type size={14} className="text-gray-400" />}
                            <span className={clsx(
                                "font-medium",
                                col.pk ? "text-gray-900" : "text-gray-600"
                            )}>{col.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 italic">{col.type}</span>
                            {col.nullable && <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded">NULL</span>}
                        </div>

                        {/* Right Handle (Source) */}
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`${col.name}-source`}
                            className="!bg-blue-400 !w-2 !h-2 !-right-2"
                            style={{ top: '50%', transform: 'translateY(-50%)' }}
                        />
                    </div>
                ))}
                {data.columns.length === 0 && (
                    <div className="text-xs text-gray-400 p-2 text-center">No columns</div>
                )}
            </div>
        </div>
    );
};

export default memo(TableNode);
