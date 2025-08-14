import { getAllPosts, type Post } from '@/lib/sanity'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LazyDarkModeToggle } from '@/components/LazyComponents'
import { 
  ArrowLeft, 
  Heart, 
  BookOpen, 
  TrendingUp, 
  Users, 
  DollarSign,
  Building2,
  FileText
} from 'lucide-react'

// キャッシュ無効化
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CategoryInfo {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  slug: string
}

const categories: CategoryInfo[] = [
  {
    name: '基礎知識・入門',
    description: '看護助手の基本的な知識や技術について詳しく解説',
    icon: BookOpen,
    color: 'medical',
    slug: 'basics'
  },
  {
    name: 'キャリア・資格',
    description: '転職や資格取得、キャリアアップの方法を紹介',
    icon: TrendingUp,
    color: 'clean',
    slug: 'career'
  },
  {
    name: '実務・ノウハウ',
    description: '実際の現場で役立つ実践的なスキルとノウハウ',
    icon: Users,
    color: 'medical',
    slug: 'practice'
  },
  {
    name: '給与・待遇',
    description: '給与体系や労働条件、福利厚生について',
    icon: DollarSign,
    color: 'clean',
    slug: 'salary'
  },
  {
    name: '職場別情報',
    description: '病院、クリニック、介護施設など職場別の特徴',
    icon: Building2,
    color: 'medical',
    slug: 'workplace'
  }
]

export default async function CategoriesPage() {
  let posts: Post[] = []
  
  try {
    posts = await getAllPosts()
  } catch (error) {
    console.error('Failed to load posts:', error)
  }

  // カテゴリー別記事数を集計
  const categoryCounts = posts.reduce((acc: Record<string, number>, post) => {
    if (post.categories && post.categories.length > 0) {
      post.categories.forEach(category => {
        acc[category] = (acc[category] || 0) + 1
      })
    }
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-professional-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="inline-flex items-center text-professional-700 hover:text-medical-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-medical-500 to-medical-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white" />
                </div>
                <span>ProReNata</span>
              </div>
            </Link>
            
            <LazyDarkModeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-professional-900 mb-4">
              カテゴリー別ガイド
            </h1>
            <p className="text-lg text-professional-700 max-w-2xl mx-auto">
              看護助手として必要な知識を分野別に整理しています
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {categories.map((category) => {
              const count = categoryCounts[category.name] || 0
              const IconComponent = category.icon
              
              return (
                <Link
                  key={category.name}
                  href={`/categories/${category.slug}`}
                  className="medical-card group hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      category.color === 'medical' 
                        ? 'from-medical-500 to-medical-600' 
                        : 'from-clean-500 to-clean-600'
                    } flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant={category.color === 'medical' ? 'medical' : 'clean'}>
                      {count}記事
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-professional-900 mb-2 group-hover:text-medical-600 transition-colors">
                    {category.name}
                  </h3>
                  
                  <p className="text-professional-700 text-sm leading-relaxed mb-4">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center text-medical-600 text-sm font-medium mt-auto">
                    詳しく見る
                    <ArrowLeft className="w-4 h-4 ml-1 rotate-180 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>

          {/* All Articles Section */}
          <div className="medical-card p-8 text-center">
            <FileText className="w-16 h-16 mx-auto text-professional-400 mb-4" />
            <h3 className="text-2xl font-bold text-professional-900 mb-4">
              すべての記事を見る
            </h3>
            <p className="text-professional-700 mb-6 max-w-md mx-auto">
              カテゴリーに関係なく、全ての記事を一覧で確認できます
            </p>
            <Link href="/posts">
              <Button size="lg" className="px-8">
                記事一覧を見る
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}