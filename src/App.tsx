import { useEffect, useState } from 'react'
import {
  BarChart3, CalendarDays, Check, ChevronRight, CirclePlus, ClipboardList,
  CookingPot, Download, ImagePlus, Leaf, Minus, Pencil, Plus, Search, Settings2, ShoppingBasket,
  Sparkles, Sprout, Trash2, Upload, Utensils, X,
} from 'lucide-react'
import './App.css'
import { loadAppState, saveAppState } from './storage'

type Page = 'today' | 'list' | 'stats' | 'dishes'
type Meal = '早餐' | '中餐' | '晚餐'
type Dish = {
  id: number
  name: string
  category: string
  description: string
  image: string
  meals: Meal[]
  tags: string[]
  ingredients: string
  estimatedAmount: string
  cookingMethod: string
  defaultPortion: string
}

type DishDraft = Omit<Dish, 'id'>

type PlanItem = {
  id: number
  dish: DishDraft
  meal: Meal
  date: string
  portion: number
  purchased: boolean
}

type ActualItem = {
  id: number
  sourcePlanId?: number
  dish: DishDraft
  meal: Meal
  date: string
  portion: number
}

type PortionSettings = Record<Meal, number>
type AppData = { dishes: Dish[]; planItems: PlanItem[]; actualItems: ActualItem[]; portions: PortionSettings }
const initialPortions: PortionSettings = { 早餐: 1, 中餐: 1, 晚餐: 1 }

const emptyDish: DishDraft = {
  name: '', category: '', description: '', image: '', meals: [], tags: [],
  ingredients: '', estimatedAmount: '', cookingMethod: '', defaultPortion: '',
}

const navItems: { id: Page; label: string; icon: typeof Utensils }[] = [
  { id: 'today', label: '今日选菜', icon: Utensils },
  { id: 'list', label: '待选清单', icon: ClipboardList },
  { id: 'stats', label: '饮食统计', icon: BarChart3 },
  { id: 'dishes', label: '菜品设置', icon: Settings2 },
]
const pageTitles: Record<Page, { eyebrow: string; title: string }> = {
  today: { eyebrow: '11月8日 · 星期日', title: '今天想吃点什么？' },
  list: { eyebrow: '今日计划', title: '待选清单' },
  stats: { eyebrow: '饮食回顾', title: '吃得丰富，也吃得安心' },
  dishes: { eyebrow: '我的厨房', title: '菜品设置' },
}

function App() {
  const [page, setPage] = useState<Page>('today')
  const [meal, setMeal] = useState<Meal>('中餐')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [planItems, setPlanItems] = useState<PlanItem[]>([])
  const [actualItems, setActualItems] = useState<ActualItem[]>([])
  const [portions, setPortions] = useState<PortionSettings>(initialPortions)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadAppState<AppData>().then((data) => {
      if (data) {
        setDishes(data.dishes ?? [])
        setPlanItems(data.planItems ?? [])
        setActualItems(data.actualItems ?? [])
        setPortions(data.portions ?? initialPortions)
      }
    }).finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (loaded) void saveAppState({ dishes, planItems, actualItems, portions })
  }, [actualItems, dishes, loaded, planItems, portions])

  const addToPlan = (dish: Dish, selectedMeal: Meal) => {
    const { id: _dishId, ...snapshot } = dish
    setPlanItems((current) => [...current, {
      id: Date.now(), dish: snapshot, meal: selectedMeal, date: '2026-11-08',
      portion: Number(dish.defaultPortion.replace(/[^0-9.]/g, '')) || portions[selectedMeal], purchased: false,
    }])
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setPage('today')}>
          <span className="brand-mark"><Leaf size={21} /></span><span>食刻</span>
        </button>
        <div className="date-chip"><CalendarDays size={16} /> 11月8日</div>
      </header>
      <main className="page-wrap">
        <section className="page-heading"><p>{pageTitles[page].eyebrow}</p><h1>{pageTitles[page].title}</h1></section>
        {page === 'today' && <TodayPage meal={meal} setMeal={setMeal} dishes={dishes} planItems={planItems} addToPlan={addToPlan} onOpenDishes={() => setPage('dishes')} />}
        {page === 'list' && <PlanPage planItems={planItems} setPlanItems={setPlanItems} onConfirm={(items) => setActualItems((current) => [...current, ...items])} savedCount={actualItems.length} />}
        {page === 'stats' && <StatsPage actualItems={actualItems} />}
        {page === 'dishes' && <DishesPage dishes={dishes} setDishes={setDishes} portions={portions} setPortions={setPortions} backup={{ dishes, planItems, actualItems, portions }} restore={(data) => { setDishes(data.dishes ?? []); setPlanItems(data.planItems ?? []); setActualItems(data.actualItems ?? []); setPortions(data.portions ?? initialPortions) }} />}
      </main>
      <nav className="bottom-nav" aria-label="主要导航">
        {navItems.map((item) => {
          const Icon = item.icon
          return <button type="button" key={item.id} className={page === item.id ? 'active' : ''} onClick={() => setPage(item.id)}>
            <Icon size={21} strokeWidth={page === item.id ? 2.6 : 2} /><span>{item.label}</span>
          </button>
        })}
      </nav>
    </div>
  )
}

function TodayPage({ meal, setMeal, dishes, planItems, addToPlan, onOpenDishes }: {
  meal: Meal
  setMeal: (meal: Meal) => void
  dishes: Dish[]
  planItems: PlanItem[]
  addToPlan: (dish: Dish, meal: Meal) => void
  onOpenDishes: () => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')
  const categories = ['全部', ...Array.from(new Set(dishes.map((dish) => dish.category).filter(Boolean)))]
  const mealDishes = dishes.filter((dish) => (!dish.meals.length || dish.meals.includes(meal)) && (!query || dish.name.includes(query)) && (category === '全部' || dish.category === category))
  return <>
    <section className="welcome-card">
      <div><span className="soft-label"><Sparkles size={14} /> 今日灵感</span><h2>好好吃饭，<br />就是生活的小确幸。</h2><p>从熟悉的味道里，挑选今天的一日三餐。</p></div>
      <div className="welcome-art" aria-hidden="true"><span>🥬</span><span>🍅</span><span>🥕</span></div>
    </section>
    <section className="control-panel empty-control-panel">
      <div className="meal-tabs" aria-label="选择餐次">
        {(['早餐', '中餐', '晚餐'] as Meal[]).map((item) => <button type="button" key={item} className={meal === item ? 'active' : ''} onClick={() => setMeal(item)}>
          {item}<span>{item === '早餐' ? '08:00' : item === '中餐' ? '12:00' : '18:30'}</span>
        </button>)}
      </div>
      {!!dishes.length && <><label className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索想吃的菜" /></label><div className="filter-row">{categories.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></>}
    </section>
    <section className="section-block">
      <div className="section-title"><div><span>{meal}选菜</span><h2>我的菜品</h2></div><small>{mealDishes.length} 道菜</small></div>
      {!mealDishes.length ? <div className="empty-state home-empty-state">
        <span className="empty-icon"><CookingPot size={27} /></span>
        <h3>还没有添加菜品</h3>
        <p>先把家里常做的菜录入菜品库，添加完成后，它们就会出现在这里。</p>
        <button type="button" onClick={onOpenDishes}><Plus size={17} /> 去添加菜品</button>
      </div> : <div className="dish-grid">{mealDishes.map((dish) => <article className="dish-card" key={dish.id}>
        <div className={`dish-image${dish.image ? '' : ' image-placeholder'}`}>{dish.image ? <img src={dish.image} alt={dish.name || '未命名菜品'} /> : <CookingPot size={34} />}{dish.category && <span>{dish.category}</span>}</div>
        <div className="dish-copy"><div className="dish-name-row"><h3>{dish.name || '未命名菜品'}</h3><button type="button" className={planItems.some((item) => item.dish.name === dish.name && item.meal === meal) ? 'add-button selected' : 'add-button'} onClick={() => addToPlan(dish, meal)} aria-label={`加入${dish.name || '未命名菜品'}到${meal}`}>{planItems.some((item) => item.dish.name === dish.name && item.meal === meal) ? <Check size={19} /> : <Plus size={19} />}</button></div>{dish.description && <p>{dish.description}</p>}<div className="tag-row">{dish.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
      </article>)}</div>}
    </section>
  </>
}

function PlanPage({ planItems, setPlanItems, onConfirm, savedCount }: {
  planItems: PlanItem[]
  setPlanItems: React.Dispatch<React.SetStateAction<PlanItem[]>>
  onConfirm: (items: ActualItem[]) => void
  savedCount: number
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actualDrafts, setActualDrafts] = useState<(ActualItem & { selected: boolean })[]>([])

  const updatePlan = (id: number, changes: Partial<PlanItem>) => setPlanItems((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  const openConfirm = () => {
    setActualDrafts(planItems.filter((item) => item.date === '2026-11-08').map((item) => ({ id: Date.now() + item.id, sourcePlanId: item.id, dish: item.dish, meal: item.meal, date: item.date, portion: item.portion, selected: true })))
    setConfirmOpen(true)
  }
  const addTemporary = () => setActualDrafts((current) => [...current, { id: Date.now(), dish: { ...emptyDish, name: '临时菜品' }, meal: '晚餐', date: '2026-11-08', portion: 1, selected: true }])
  const saveActualMenu = () => {
    const selected = actualDrafts.filter((item) => item.selected)
    onConfirm(selected.map(({ selected: _selected, ...item }) => item))
    const confirmedIds = selected.flatMap((item) => item.sourcePlanId ? [item.sourcePlanId] : [])
    setPlanItems((current) => current.filter((item) => !confirmedIds.includes(item.id)))
    setConfirmOpen(false)
  }

  return <>
    <section className="summary-strip"><div><ShoppingBasket size={22} /><span><strong>{planItems.length}</strong> 道待选菜品</span></div><button type="button">11月8日 <ChevronRight size={16} /></button></section>
    {savedCount > 0 && <p className="saved-notice"><Check size={15} /> 本次已有 {savedCount} 道实际菜品保存到饮食记录</p>}
    <div className="plan-layout">
      <section className="plan-list">
        {(['早餐', '中餐', '晚餐'] as Meal[]).map((mealName) => {
          return <div className="meal-group" key={mealName}>
            <div className="meal-group-title"><div><span>{mealName === '早餐' ? '08:00' : mealName === '中餐' ? '12:00' : '18:30'}</span><h2>{mealName}</h2></div><button type="button"><CirclePlus size={18} /> 添加</button></div>
            {!planItems.some((item) => item.meal === mealName) ? <p className="meal-empty">暂未选择{mealName}菜品</p> : planItems.filter((item) => item.meal === mealName).map((item) => <article className="plan-item" key={item.id}>
              <div className={`plan-thumb${item.dish.image ? '' : ' image-placeholder'}`}>{item.dish.image ? <img src={item.dish.image} alt={item.dish.name || '未命名菜品'} /> : <CookingPot size={23} />}</div>
              <div className="plan-item-main"><div><h3>{item.dish.name || '未命名菜品'}</h3><span>{item.dish.category || '未分类'}</span></div><div className="plan-controls">
                <label>日期<input type="date" value={item.date} onChange={(event) => updatePlan(item.id, { date: event.target.value })} /></label>
                <label>餐次<select value={item.meal} onChange={(event) => updatePlan(item.id, { meal: event.target.value as Meal })}>{(['早餐', '中餐', '晚餐'] as Meal[]).map((value) => <option key={value}>{value}</option>)}</select></label>
              </div><div className="plan-item-bottom"><button type="button" className={item.purchased ? 'purchase ready' : 'purchase'} onClick={() => updatePlan(item.id, { purchased: !item.purchased })}>{item.purchased && <Check size={13} />}{item.purchased ? '食材已购' : '食材待购'}</button><div className="stepper"><button type="button" onClick={() => updatePlan(item.id, { portion: Math.max(.5, item.portion - .5) })}><Minus size={14} /></button><span>{item.portion} 份</span><button type="button" onClick={() => updatePlan(item.id, { portion: item.portion + .5 })}><Plus size={14} /></button></div></div></div>
              <button className="remove-button" type="button" onClick={() => setPlanItems((current) => current.filter((value) => value.id !== item.id))} aria-label={`删除${item.dish.name || '未命名菜品'}`}><X size={17} /></button>
            </article>)}
          </div>
        })}
      </section>
      <aside className="confirm-card empty-confirm-card"><span><CookingPot size={18} /> 今日菜单</span><h2>{planItems.length ? '准备确认实际菜单' : '待选清单还是空的'}</h2><p>{planItems.length ? '只把真正制作的菜保存到饮食记录，未制作的菜可以继续保留。' : '先从首页挑选想做的菜，之后再来确认今天真正制作的菜单。'}</p><button type="button" disabled={!planItems.length} onClick={openConfirm}>确认今日实际菜单 <ChevronRight size={19} /></button></aside>
    </div>
    {confirmOpen && <div className="modal-backdrop" role="presentation"><section className="dish-modal actual-modal" role="dialog" aria-modal="true" aria-labelledby="actual-title">
      <div className="modal-header"><div><span>11月8日</span><h2 id="actual-title">确认实际菜单</h2></div><button type="button" onClick={() => setConfirmOpen(false)} aria-label="关闭确认窗口"><X size={21} /></button></div>
      <p className="optional-note">勾选真正制作的菜；未勾选的待选菜品会继续保留。</p>
      <div className="actual-list">{actualDrafts.map((item) => <article className={item.selected ? 'actual-item selected' : 'actual-item'} key={item.id}>
        <button type="button" className="actual-check" onClick={() => setActualDrafts((current) => current.map((value) => value.id === item.id ? { ...value, selected: !value.selected } : value))}>{item.selected && <Check size={17} />}</button>
        <div><input value={item.dish.name} onChange={(event) => setActualDrafts((current) => current.map((value) => value.id === item.id ? { ...value, dish: { ...value.dish, name: event.target.value } } : value))} aria-label="实际菜品名称" /><span>{item.meal}</span></div>
        <div className="stepper"><button type="button" onClick={() => setActualDrafts((current) => current.map((value) => value.id === item.id ? { ...value, portion: Math.max(.5, value.portion - .5) } : value))}><Minus size={14} /></button><span>{item.portion}份</span><button type="button" onClick={() => setActualDrafts((current) => current.map((value) => value.id === item.id ? { ...value, portion: value.portion + .5 } : value))}><Plus size={14} /></button></div>
        <button type="button" className="actual-remove" onClick={() => setActualDrafts((current) => current.filter((value) => value.id !== item.id))} aria-label="从实际菜单删除"><Trash2 size={16} /></button>
      </article>)}</div>
      <button type="button" className="temporary-button" onClick={addTemporary}><Plus size={17} /> 添加临时制作的菜</button>
      <div className="modal-actions"><button type="button" onClick={() => setConfirmOpen(false)}>取消</button><button type="button" onClick={saveActualMenu}>确认并保存</button></div>
    </section></div>}
  </>
}

function StatsPage({ actualItems }: { actualItems: ActualItem[] }) {
  const [selectedDate, setSelectedDate] = useState('2026-11-08')
  const selectedItems = actualItems.filter((item) => item.date === selectedDate)
  const selectedMonth = selectedDate.slice(0, 7)
  const monthItems = actualItems.filter((item) => item.date.startsWith(selectedMonth))
  const selectedDateLabel = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${selectedDate}T12:00:00`))
  const monthLabel = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(new Date(`${selectedMonth}-01T12:00:00`))
  const counts = monthItems.reduce<Record<string, number>>((result, item) => {
    const name = item.dish.name || '未命名菜品'
    result[name] = (result[name] ?? 0) + 1
    return result
  }, {})
  const ranking = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const categoryCounts = monthItems.reduce<Record<string, number>>((result, item) => {
    const category = item.dish.category || '未分类'
    result[category] = (result[category] ?? 0) + 1
    return result
  }, {})
  const uniqueMeals = new Set(monthItems.map((item) => `${item.date}-${item.meal}`)).size
  const mealFavorite = (meal: Meal) => {
    const names = monthItems.filter((item) => item.meal === meal).map((item) => item.dish.name || '未命名菜品')
    return names.sort((a, b) => names.filter((name) => name === b).length - names.filter((name) => name === a).length)[0] || '暂无记录'
  }
  return <>
    <section className="history-toolbar">
      <div><span>历史菜单</span><h2>{selectedDateLabel}</h2></div>
      <label className="date-picker"><CalendarDays size={17} /><input type="date" value={selectedDate} max="2026-11-08" onChange={(event) => setSelectedDate(event.target.value)} aria-label="选择饮食记录日期" /></label>
    </section>
    <section className="today-stats history-stats">
      <div className="stats-intro"><span className="soft-label"><Sprout size={14} /> 当日饮食</span><h2>{selectedItems.length ? `已确认 ${selectedItems.length} 道菜` : '这一天未记录'}</h2><p>{selectedItems.length ? `蛋白质来源：${selectedItems.flatMap((item) => item.dish.tags).filter((tag) => tag.includes('蛋白')).join('、') || '未填写'}；以下是当天真正确认过的菜单。` : '未记录不代表没有吃饭，只表示这一天没有保存实际菜单。'}</p></div>
      {selectedItems.length ? <div className="history-menu">{(['早餐','中餐','晚餐'] as Meal[]).map((meal) => {
        const items = selectedItems.filter((item) => item.meal === meal)
        return items.length ? <div key={meal}><span>{meal}</span><ul>{items.map((item) => <li key={item.id}><strong>{item.dish.name || '未命名菜品'}</strong><em>{item.portion} 份</em></li>)}</ul></div> : null
      })}</div> : <span className="empty-stats-icon"><BarChart3 size={34} /></span>}
    </section>
    <section className="month-section">
      <div className="section-title"><div><span>{monthLabel}</span><h2>月度饮食报告</h2></div><span className="month-tag">所选月份</span></div>
      {!monthItems.length ? <div className="empty-state report-empty"><BarChart3 size={28} /><h3>暂无月度报告</h3><p>本月确认过的实际菜单会自动汇总到这里，不会推断未记录的日期。</p></div> : <>
        <div className="metric-grid"><div><span>记录餐次</span><strong>{uniqueMeals}</strong><small>餐</small></div><div><span>菜品种类</span><strong>{Object.keys(counts).length}</strong><small>种</small></div><div><span>实际菜品</span><strong>{monthItems.length}</strong><small>道</small></div></div>
        <div className="report-grid"><article className="report-card"><div className="card-title"><div><span>出现次数</span><h3>菜品排行榜</h3></div><BarChart3 size={20} /></div><div className="ranking-list">{ranking.map(([name, count], index) => <div className="rank-row" key={name}><b>{index + 1}</b><span>{name}</span><div><i style={{ width: `${Math.max(15, count / ranking[0][1] * 100)}%` }} /></div><em>{count}次</em></div>)}</div></article><article className="report-card"><div className="card-title"><div><span>三餐偏爱</span><h3>最常出现</h3></div><Utensils size={20} /></div><div className="favorite-meals">{(['早餐','中餐','晚餐'] as Meal[]).map((meal) => <div key={meal}><span>{meal}</span><strong>{mealFavorite(meal)}</strong></div>)}</div></article><article className="report-card"><div className="card-title"><div><span>搭配分布</span><h3>菜品分类统计</h3></div><Leaf size={20} /></div><div className="category-stats">{Object.entries(categoryCounts).map(([name, count]) => <span key={name}><b>{name}</b><em>{count} 道</em></span>)}</div></article></div>
      </>}
    </section>
  </>
}

function DishesPage({ dishes, setDishes, portions, setPortions, backup, restore }: {
  dishes: Dish[]
  setDishes: React.Dispatch<React.SetStateAction<Dish[]>>
  portions: PortionSettings
  setPortions: React.Dispatch<React.SetStateAction<PortionSettings>>
  backup: AppData
  restore: (data: AppData) => void
}) {
  const [dishQuery, setDishQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<DishDraft>(emptyDish)
  const shown = dishes.filter((dish) => dish.name.includes(dishQuery.trim()))

  const openCreate = () => {
    setEditingId(null)
    setDraft(emptyDish)
    setIsFormOpen(true)
  }
  const openEdit = (dish: Dish) => {
    const { id, ...values } = dish
    setEditingId(id)
    setDraft(values)
    setIsFormOpen(true)
  }
  const saveDish = () => {
    if (editingId === null) {
      setDishes((current) => [...current, { id: Date.now(), ...draft }])
    } else {
      setDishes((current) => current.map((dish) => dish.id === editingId ? { id: editingId, ...draft } : dish))
    }
    setIsFormOpen(false)
  }
  const selectImage = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDraft((current) => ({ ...current, image: String(reader.result || '') }))
    reader.readAsDataURL(file)
  }
  const toggleMeal = (meal: Meal) => setDraft((current) => ({
    ...current,
    meals: current.meals.includes(meal) ? current.meals.filter((item) => item !== meal) : [...current.meals, meal],
  }))
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...backup }, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `食刻备份-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  const importBackup = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { restore(JSON.parse(String(reader.result)) as AppData) } catch { window.alert('备份文件无法识别，请选择食刻导出的 JSON 文件。') }
    }
    reader.readAsText(file)
  }

  return <>
    <section className="dish-tools"><label className="search-box"><Search size={19} /><input value={dishQuery} onChange={(event) => setDishQuery(event.target.value)} placeholder="搜索我的菜品" /></label><button className="primary-button" type="button" onClick={openCreate}><Plus size={19} /> 录入菜品</button></section>
    <section className="entry-mode-card single-entry-card"><div><span className="soft-label"><CookingPot size={14} /> 菜品录入</span><h2>想写多少，就写多少</h2><p>所有信息都可以留空，之后也能随时补充或修改。</p></div><button type="button" onClick={openCreate}><Plus size={18} /> 开始录入</button></section>
    <section className="settings-grid"><article><h3>默认份量</h3><p>加入待选清单时使用，可随时修改。</p><div className="portion-settings">{(['早餐','中餐','晚餐'] as Meal[]).map((meal) => <label key={meal}>{meal}<input type="number" min="0.5" step="0.5" value={portions[meal]} onChange={(event) => setPortions((current) => ({ ...current, [meal]: Number(event.target.value) || .5 }))} /></label>)}</div></article><article><h3>数据备份</h3><p>导出全部本地数据，或从备份文件恢复。</p><div className="backup-actions"><button type="button" onClick={exportBackup}><Download size={16} />导出备份</button><label><Upload size={16} />恢复备份<input type="file" accept="application/json" onChange={(event) => importBackup(event.target.files?.[0])} /></label></div></article></section>
    <section className="section-block dishes-library"><div className="section-title"><div><span>共 {shown.length} 道</span><h2>我的菜品库</h2></div><button className="filter-button" type="button"><Settings2 size={16} /> 全部分类</button></div>{!shown.length ? <div className="empty-state library-empty"><CookingPot size={28} /><h3>{dishes.length ? '没有找到菜品' : '菜品库还是空的'}</h3><p>{dishes.length ? '换个菜名搜索试试。' : '点击“录入菜品”，从第一道家常菜开始建立自己的菜品库。'}</p></div> : <div className="library-grid">{shown.map((dish) => <article className="library-card" key={dish.id}>
      <div className={`library-image${dish.image ? '' : ' image-placeholder'}`}>{dish.image ? <img src={dish.image} alt={dish.name || '未命名菜品'} /> : <CookingPot size={25} />}</div>
      <div><span>{dish.category || '未分类'}</span><h3>{dish.name || '未命名菜品'}</h3><p>{dish.meals.length ? dish.meals.join(' · ') : '全部餐次'}</p><div className="library-tags">{dish.tags.map((tag) => <i key={tag}>{tag}</i>)}</div></div>
      <div className="library-actions"><button type="button" onClick={() => openEdit(dish)} aria-label={`编辑${dish.name || '未命名菜品'}`}><Pencil size={16} /></button><button type="button" onClick={() => setDishes((current) => current.filter((item) => item.id !== dish.id))} aria-label={`删除${dish.name || '未命名菜品'}`}><Trash2 size={16} /></button></div>
    </article>)}</div>}</section>
    {isFormOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsFormOpen(false)}>
      <section className="dish-modal" role="dialog" aria-modal="true" aria-labelledby="dish-form-title">
        <div className="modal-header"><div><span>{editingId === null ? '新增' : '编辑'}</span><h2 id="dish-form-title">录入菜品</h2></div><button type="button" onClick={() => setIsFormOpen(false)} aria-label="关闭录入窗口"><X size={21} /></button></div>
        <p className="optional-note">所有项目均为选填，可以直接添加。</p>
        <div className="form-grid">
          <label className="photo-field"><span>照片</span><input type="file" accept="image/*" onChange={(event) => selectImage(event.target.files?.[0])} />{draft.image ? <img src={draft.image} alt="菜品预览" /> : <span className="photo-placeholder"><ImagePlus size={24} />选择照片</span>}</label>
          <label><span>菜品名称</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="例如：番茄炒蛋" /></label>
          <label><span>菜品分类</span><input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="例如：家常菜" /></label>
          <fieldset><legend>适用餐次</legend><div className="meal-options">{(['早餐', '中餐', '晚餐'] as Meal[]).map((item) => <button type="button" key={item} className={draft.meals.includes(item) ? 'active' : ''} onClick={() => toggleMeal(item)}>{item}</button>)}</div></fieldset>
          <label className="full-field"><span>简单介绍</span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="简单写写味道或特点" rows={3} /></label>
          <label><span>食材名称</span><input value={draft.ingredients} onChange={(event) => setDraft({ ...draft, ingredients: event.target.value })} placeholder="例如：番茄、鸡蛋" /></label>
          <label><span>预估用量</span><input value={draft.estimatedAmount} onChange={(event) => setDraft({ ...draft, estimatedAmount: event.target.value })} placeholder="例如：适量、2个" /></label>
          <label><span>营养标签</span><input value={draft.tags.join('、')} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean) })} placeholder="例如：蛋白质、蔬菜" /></label>
          <label><span>烹饪方式</span><input value={draft.cookingMethod} onChange={(event) => setDraft({ ...draft, cookingMethod: event.target.value })} placeholder="例如：清炒、蒸煮" /></label>
          <label><span>默认份量</span><input value={draft.defaultPortion} onChange={(event) => setDraft({ ...draft, defaultPortion: event.target.value })} placeholder="例如：2份" /></label>
        </div>
        <div className="modal-actions"><button type="button" onClick={() => setIsFormOpen(false)}>取消</button><button type="button" onClick={saveDish}>{editingId === null ? '添加菜品' : '保存修改'}</button></div>
      </section>
    </div>}
  </>
}

export default App
