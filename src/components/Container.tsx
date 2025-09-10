/**
 * 統一コンテナコンポーネント
 * 参照リポジトリの思想を踏襲：全ページで同一の横幅・中央揃えを実現
 */
export default function Container({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={`mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}