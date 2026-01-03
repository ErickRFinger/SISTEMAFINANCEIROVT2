import { useState } from 'react'
import './Calculadora.css'

export default function Calculadora() {
    const [current, setCurrent] = useState('')
    const [previous, setPrevious] = useState('')
    const [operation, setOperation] = useState(null)

    const appendNumber = (number) => {
        if (number === '.' && current.includes('.')) return
        if (current.length > 12) return // Max digits
        setCurrent(current.toString() + number.toString())
    }

    const chooseOperation = (op) => {
        if (current === '') return
        if (previous !== '') {
            calculate()
        }
        setOperation(op)
        setPrevious(current)
        setCurrent('')
    }

    const calculate = () => {
        let result
        const prev = parseFloat(previous)
        const curr = parseFloat(current)
        if (isNaN(prev) || isNaN(curr)) return

        switch (operation) {
            case '+':
                result = prev + curr
                break
            case '-':
                result = prev - curr
                break
            case '×':
                result = prev * curr
                break
            case '÷':
                result = curr === 0 ? 0 : prev / curr
                break
            case '%':
                result = (prev * curr) / 100
                break
            default:
                return
        }

        // Format result to avoid long decimals
        setCurrent(parseFloat(result.toFixed(4)).toString())
        setOperation(null)
        setPrevious('')
    }

    const clear = () => {
        setCurrent('')
        setPrevious('')
        setOperation(null)
    }

    const deleteNumber = () => {
        setCurrent(current.toString().slice(0, -1))
    }

    return (
        <div className="container calculadora-container">
            <div className="calculator-wrapper">
                <div className="calc-screen">
                    <div className="calc-previous">
                        {previous} {operation}
                    </div>
                    <div className="calc-current">
                        {current || '0'}
                    </div>
                </div>

                <div className="calc-grid">
                    <button className="calc-btn action" onClick={clear}>AC</button>
                    <button className="calc-btn action" onClick={deleteNumber}>⌫</button>
                    <button className="calc-btn op" onClick={() => chooseOperation('%')}>%</button>
                    <button className={`calc-btn op ${operation === '÷' ? 'active' : ''}`} onClick={() => chooseOperation('÷')}>÷</button>

                    <button className="calc-btn num" onClick={() => appendNumber('7')}>7</button>
                    <button className="calc-btn num" onClick={() => appendNumber('8')}>8</button>
                    <button className="calc-btn num" onClick={() => appendNumber('9')}>9</button>
                    <button className={`calc-btn op ${operation === '×' ? 'active' : ''}`} onClick={() => chooseOperation('×')}>×</button>

                    <button className="calc-btn num" onClick={() => appendNumber('4')}>4</button>
                    <button className="calc-btn num" onClick={() => appendNumber('5')}>5</button>
                    <button className="calc-btn num" onClick={() => appendNumber('6')}>6</button>
                    <button className={`calc-btn op ${operation === '-' ? 'active' : ''}`} onClick={() => chooseOperation('-')}>-</button>

                    <button className="calc-btn num" onClick={() => appendNumber('1')}>1</button>
                    <button className="calc-btn num" onClick={() => appendNumber('2')}>2</button>
                    <button className="calc-btn num" onClick={() => appendNumber('3')}>3</button>
                    <button className={`calc-btn op ${operation === '+' ? 'active' : ''}`} onClick={() => chooseOperation('+')}>+</button>

                    <button className="calc-btn num span-2" onClick={() => appendNumber('0')}>0</button>
                    <button className="calc-btn num" onClick={() => appendNumber('.')}>.</button>
                    <button className="calc-btn equals" onClick={calculate}>=</button>
                </div>
            </div>
        </div>
    )
}
