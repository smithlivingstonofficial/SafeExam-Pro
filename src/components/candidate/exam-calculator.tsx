"use client";

import { useState } from "react";
import { Calculator as CalcIcon, X, Delete, RotateCcw } from "lucide-react";

interface ExamCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExamCalculator({ isOpen, onClose }: ExamCalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string>("");

  if (!isOpen) return null;

  function handleDigit(digit: string) {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  }

  function handleDecimal() {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }

  function handleClear() {
    setDisplay("0");
    setPrevValue(null);
    setOperation(null);
    setWaitingForOperand(false);
    setHistory("");
  }

  function handleBackspace() {
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }

  function handleOperator(nextOp: string) {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setHistory(`${display} ${nextOp}`);
    } else if (operation) {
      const currentValue = prevValue || 0;
      const newValue = performCalculation(currentValue, inputValue, operation);
      setPrevValue(newValue);
      setDisplay(String(roundResult(newValue)));
      setHistory(`${roundResult(newValue)} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperation(nextOp);
  }

  function performCalculation(a: number, b: number, op: string): number {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b !== 0 ? a / b : 0;
      case "^":
        return Math.pow(a, b);
      default:
        return b;
    }
  }

  function handleEquals() {
    const inputValue = parseFloat(display);

    if (prevValue !== null && operation) {
      const result = performCalculation(prevValue, inputValue, operation);
      setDisplay(String(roundResult(result)));
      setHistory(`${prevValue} ${operation} ${inputValue} =`);
      setPrevValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  }

  function handleScientific(func: string) {
    const value = parseFloat(display);
    let result = 0;

    switch (func) {
      case "sqrt":
        result = Math.sqrt(value);
        break;
      case "sq":
        result = Math.pow(value, 2);
        break;
      case "inv":
        result = value !== 0 ? 1 / value : 0;
        break;
      case "log":
        result = Math.log10(value);
        break;
      case "ln":
        result = Math.log(value);
        break;
      case "sin":
        result = Math.sin((value * Math.PI) / 180);
        break;
      case "cos":
        result = Math.cos((value * Math.PI) / 180);
        break;
      case "tan":
        result = Math.tan((value * Math.PI) / 180);
        break;
      case "pi":
        setDisplay(String(Math.PI));
        return;
      case "e":
        setDisplay(String(Math.E));
        return;
    }

    setDisplay(String(roundResult(result)));
    setHistory(`${func}(${value})`);
    setWaitingForOperand(true);
  }

  function roundResult(val: number): number {
    return Math.round(val * 100000000) / 100000000;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="w-80 bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <CalcIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold tracking-tight">On-Screen Calculator</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-right">
          <div className="text-[11px] font-mono text-slate-400 h-4 truncate">
            {history || "\u00A0"}
          </div>
          <div className="text-2xl font-mono font-black text-slate-900 tracking-tight truncate mt-1">
            {display}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="p-3 bg-white space-y-2 select-none">
          {/* Scientific Row 1 */}
          <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
            <button
              onClick={() => handleScientific("sin")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              sin
            </button>
            <button
              onClick={() => handleScientific("cos")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              cos
            </button>
            <button
              onClick={() => handleScientific("tan")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              tan
            </button>
            <button
              onClick={() => handleScientific("pi")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              π
            </button>
            <button
              onClick={() => handleScientific("e")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              e
            </button>
          </div>

          {/* Scientific Row 2 */}
          <div className="grid grid-cols-5 gap-1 text-[11px] font-bold">
            <button
              onClick={() => handleScientific("sqrt")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              √x
            </button>
            <button
              onClick={() => handleScientific("sq")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              x²
            </button>
            <button
              onClick={() => handleOperator("^")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              xʸ
            </button>
            <button
              onClick={() => handleScientific("log")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              log
            </button>
            <button
              onClick={() => handleScientific("ln")}
              className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              ln
            </button>
          </div>

          {/* Standard Numeric Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold pt-1">
            <button
              onClick={handleClear}
              className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
            >
              C
            </button>
            <button
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
            >
              <Delete className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleScientific("inv")}
              className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
            >
              1/x
            </button>
            <button
              onClick={() => handleOperator("÷")}
              className="py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm"
            >
              ÷
            </button>

            <button
              onClick={() => handleDigit("7")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              7
            </button>
            <button
              onClick={() => handleDigit("8")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              8
            </button>
            <button
              onClick={() => handleDigit("9")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              9
            </button>
            <button
              onClick={() => handleOperator("×")}
              className="py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm"
            >
              ×
            </button>

            <button
              onClick={() => handleDigit("4")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              4
            </button>
            <button
              onClick={() => handleDigit("5")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              5
            </button>
            <button
              onClick={() => handleDigit("6")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              6
            </button>
            <button
              onClick={() => handleOperator("-")}
              className="py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm"
            >
              -
            </button>

            <button
              onClick={() => handleDigit("1")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              1
            </button>
            <button
              onClick={() => handleDigit("2")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              2
            </button>
            <button
              onClick={() => handleDigit("3")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              3
            </button>
            <button
              onClick={() => handleOperator("+")}
              className="py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm"
            >
              +
            </button>

            <button
              onClick={() => handleDigit("0")}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 col-span-2"
            >
              0
            </button>
            <button
              onClick={handleDecimal}
              className="py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
            >
              .
            </button>
            <button
              onClick={handleEquals}
              className="py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-sm shadow-xs"
            >
              =
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
