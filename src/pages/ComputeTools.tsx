import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Binary, Table, Layers, BookOpen, ArrowRightLeft } from 'lucide-react';
import BaseConverter from '@/components/compute/BaseConverter';
import BinaryArithmetic from '@/components/compute/BinaryArithmetic';
import BooleanLogic from '@/components/compute/BooleanLogic';
import NumberFormats from '@/components/compute/NumberFormats';
import ReferenceTable from '@/components/compute/ReferenceTable';

type ComputeTab = 'base' | 'arith' | 'logic' | 'formats' | 'ref';

const TABS: { id: ComputeTab; label: string; icon: any; desc: string; color: string }[] = [
  { id: 'base',    label: 'Base Converter',    icon: ArrowRightLeft, desc: 'Dec·Bin·Oct·Hex + Signed',    color: 'cyan'    },
  { id: 'arith',   label: 'Binary Arithmetic', icon: Calculator,     desc: 'ADD·SUB·MUL·DIV·Bitwise',    color: 'violet'  },
  { id: 'logic',   label: 'Boolean Logic',     icon: Binary,         desc: 'Truth table·SOP·POS·Circuit', color: 'emerald' },
  { id: 'formats', label: 'Number Formats',    icon: Layers,         desc: 'IEEE 754·Gray·BCD·Hamming',   color: 'amber'   },
  { id: 'ref',     label: 'Reference Table',   icon: BookOpen,       desc: 'ASCII / conversion lookup',   color: 'rose'    },
];

export default function ComputeTools() {
  const [tab, setTab] = useState<ComputeTab>('base');
  const current = TABS.find(t => t.id === tab)!;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* ── Top nav ── */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-1.5 bg-${current.color}-500/10 border border-${current.color}-500/20 rounded-lg`}>
            <current.icon className={`w-4 h-4 text-${current.color}-400`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-200 uppercase tracking-wider">{current.label}</div>
            <div className="text-[9px] text-slate-600">{current.desc}</div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [&::-webkit-scrollbar]:hidden pb-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                tab === t.id
                  ? `bg-${t.color}-600/20 border border-${t.color}-600/30 text-${t.color}-400`
                  : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-hidden"
          >
            {tab === 'base'    && <BaseConverter />}
            {tab === 'arith'   && <BinaryArithmetic />}
            {tab === 'logic'   && <BooleanLogic />}
            {tab === 'formats' && <NumberFormats />}
            {tab === 'ref'     && <ReferenceTable />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
