import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TimeAxisProps = {
    months: Date[];
    monthWidth: number;
};

const TimeAxis = ({ months, monthWidth }: TimeAxisProps) => {
    return (
        <div className="sticky top-0 z-20 bg-slate-50/80 backdrop-blur-sm">
            <div className="relative flex h-10">
                {months.map((month, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 flex items-center justify-center border-r border-slate-200"
                        style={{ width: `${monthWidth}px` }}
                    >
                        <span className="text-sm font-semibold text-slate-600 capitalize">
                            {format(month, 'MMM/yy', { locale: ptBR })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimeAxis; 