import { useCounterStore } from '../stores/counterStore'

export function ZustandExample() {
  const { count, increment, decrement, reset } = useCounterStore()

  return (
    <section
      id="zustand"
      aria-labelledby="zustand-title"
      className="flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h2 id="zustand-title" className="mb-4 text-lg font-semibold text-gray-800">
        Zustand 예시
      </h2>
      <p className="mb-4 text-gray-600">전역 카운터 스토어 (counterStore) 사용</p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={decrement}
          className="rounded bg-gray-200 px-4 py-2 font-medium hover:bg-gray-300"
        >
          -
        </button>
        <span className="min-w-[3rem] text-center text-xl font-bold">{count}</span>
        <button
          type="button"
          onClick={increment}
          className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          +
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          초기화
        </button>
      </div>
    </section>
  )
}
