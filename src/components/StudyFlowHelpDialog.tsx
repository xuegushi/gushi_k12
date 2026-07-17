interface Props {
  open: boolean
  onClose: () => void
}

export default function StudyFlowHelpDialog({ open, onClose }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={function(e) { e.stopPropagation() }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">学习流程说明</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground cursor-pointer">✕</button>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <div>
            <div className="font-medium text-foreground mb-1">📋 计划生成</div>
            <p>自动按年级+学期创建学习计划，每个计划包含该学期教材内应学的诗词。</p>
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">📖 学习</div>
            <p>点击计划中的任意一首诗，打开背诵弹窗。阅读原文后根据记忆情况选择"记住了"或"忘记了"。</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>标记<strong>记住了</strong> → 该诗计入已完成，同时创建艾宾浩斯复习记录</li>
              <li>标记<strong>忘记了</strong> → 不计入完成，不会创建复习记录</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">🔄 艾宾浩斯复习</div>
            <p>切换到"复习" tab，按遗忘曲线安排每日复习：</p>
            <div className="mt-1 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="border-b"><th className="py-1 pr-2 text-left text-muted-foreground">阶段</th><th className="py-1 px-2 text-left text-muted-foreground">0</th><th className="py-1 px-2 text-left text-muted-foreground">1</th><th className="py-1 px-2 text-left text-muted-foreground">2</th><th className="py-1 px-2 text-left text-muted-foreground">3</th><th className="py-1 px-2 text-left text-muted-foreground">4</th><th className="py-1 px-2 text-left text-muted-foreground">5</th><th className="py-1 px-2 text-left text-muted-foreground">6</th></tr></thead>
                <tbody><tr className="border-b"><td className="py-1 pr-2 text-foreground">间隔</td><td className="py-1 px-2">1天</td><td className="py-1 px-2">2天</td><td className="py-1 px-2">4天</td><td className="py-1 px-2">7天</td><td className="py-1 px-2">15天</td><td className="py-1 px-2">30天</td><td className="py-1 px-2">60天</td></tr></tbody>
              </table>
            </div>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>复习时选<strong>记住了</strong> → 阶段 +1，下次复习间隔翻倍</li>
              <li>复习时选<strong>忘记了</strong> → 重置回阶段 0，明天再复习</li>
              <li>达到阶段 6 → 标记为已掌握，从复习列表移除</li>
            </ul>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium cursor-pointer">
          知道了
        </button>
      </div>
    </div>
  )
}
