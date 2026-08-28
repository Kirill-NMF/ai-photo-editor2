## Как безопасно переделать дизайн через Codex без поломок

Главный риск при редизайне готового приложения — Codex начинает менять логику, компоненты и структуру данных вместо того, чтобы трогать только визуальный слой. Решение — установить специализированные скиллы, которые ограничивают агента "косметическими" правками и заставляют проверять результат в реальном браузере перед завершением задачи.[^1][^2]

Ключевой принцип из официального use-case ChatGPT "Make granular UI changes": Codex должен инспектировать текущую реализацию, вносить минимально необходимое изменение и сохранять существующие компоненты, токены, слои разметки и поток данных — а не переписывать всё с нуля. Это прямо отвечает запросу "чтобы там что-то не отваливалось".[^1]

### Рекомендуемые скиллы для Codex

| Скилл / инструмент | Что делает | Установка |
|---|---|---|
| Playwright (browser skill) | Открывает приложение в реальном браузере, делает скриншоты, проверяет верстку на разных viewport перед и после правки | Встроен в Codex как "interactive skill", включается в настройках[^3][^1] |
| frontend-design (Vercel Labs) | Помогает избежать "generic AI-slop" вида, задаёт правила по цвету, типографике, композиции | `npx skills add vercel-labs/agent-skills --skill frontend-design`[^4] |
| Ai-Agent-Skills universal installer | Портирует популярные скиллы (в т.ч. Claude's frontend-design) на Codex, 39+ каталогизированных скиллов | `npx Ai-Agent-Skills install frontend-design --agent --codex`[^5] |
| Codex-Skills (TheGoat395) | Библиотека скиллов именно "premium frontend / motion / accessibility / QA / handoff" под Codex-first формат | `git clone https://github.com/TheGoat395/Codex-Skills` + `python3 scripts/install_skills.py`[^6] |
| UI Skills CLI | Подбирает нужный скилл под контекст задачи (например, "исправь motion в диалоге") прямо в момент работы | `npx ui-skills start`[^7] |
| skill-installer (официальный OpenAI) | Устанавливает скиллы из curated-списка или произвольного GitHub-репозитория в `$CODEX_HOME/skills` | Встроен в Codex app[^5][^8] |
| Figma MCP server (опционально) | Прямая передача дизайн-токенов и макетов из Figma в Codex, если есть исходный макет | `codex mcp add figma --url https://mcp.figma.com/mcp`[^3] |

Помимо готовых скиллов, есть подход "самообучения": пользователь может собрать список типичных проблем UI, которые Codex создаёт (переполненный текст, разваленная сетка, слабый контраст), и упаковать это в кастомный скилл, который прогоняет Gemini-оценку UI по скриншотам до достижения нужного балла (например 90/100), заставляя Codex итерировать самостоятельно.[^9]

### Правила, которые снижают риск "отвалившегося" функционала

- Перед началом работы прогнать `/init` в Codex, чтобы сгенерировать `AGENTS.md` с описанием структуры проекта — это даёт агенту контекст, какие файлы и паттерны нельзя нарушать.[^3]
- Явно указывать Codex "сохранить текущие компоненты, токены и поток данных, менять только визуальный слой" в каждом промпте — это ключевая фраза из официального workflow OpenAI.[^1]
- Работать точечно: один экран/один компонент за проходку, с указанием роута, viewport и желаемого результата, а не просить "обновить весь дизайн" одним запросом.[^1]
- Использовать Playwright-проверку после каждой правки: агент открывает изменённый роут в браузере и сверяет с целевым скриншотом перед переходом к следующей задаче.[^10][^1]
- Задать дизайн-систему и ограничения заранее (палитра, типографика, radius, отступы) — модели работают заметно лучше с явными токенами, чем с открытым брифом.[^11][^2]
- Официальные рекомендации OpenAI по фронтенд-промптам также фиксируют технические анти-паттерны: не делать одноцветные палитры (доминирующий фиолетовый/бежевый/тёмно-синий), не вкладывать карточки в карточки, не растягивать шрифт под viewport, использовать иконки вместо текстовых кнопок там, где это уместно.[^2]

## Как вайб-кодинг-сообщество быстро находит и переносит дизайн

Сообщество использует связку "галерея-референс → визуальный источник истины → AI-агент", а не пишет промпты с нуля. Общий паттерн — сначала зафиксировать конкретный визуальный референс (скриншот, макет, живой сайт), а затем передать его агенту вместе с четким брифом, потому что расплывчатые промпты дают "generic UI".[^12][^3]

### Топ-галереи для быстрого поиска дизайна (SaaS/веб-приложения)

| Галерея | Специализация | Формат доступа |
|---|---|---|
| SaaSUI | Реальные скриншоты SaaS-продуктов по типу экрана (dashboard, onboarding, pricing, settings, empty state) с разбором, почему паттерн работает | Бесплатный просмотр[^13] |
| Mobbin | Полные пользовательские флоу мобильных и веб-приложений, поиск по паттернам взаимодействия | Подписка для полного архива[^14][^13] |
| SaaSFrame | Маркетинговые страницы, email, полные флоу известных SaaS-продуктов | Частично платный[^13] |
| Saaspo / Land-book | Лендинги и визуальное направление по индустриям, с фильтрами по стилю и цвету | Бесплатно[^13][^15] |
| 21st.dev | 12000+ React-компонентов, шаблонов и shadcn-тем; у каждого компонента есть готовый AI-prompt для вставки через Cursor/Claude Code/v0/Codex | Бесплатно, живой предпросмотр[^16] |
| Lapa Ninja | Бесплатная галерея лендингов | Бесплатно[^13] |
| Awwwards, Dribbble, Godly, SiteInspire | Общие галереи с трендами и премиальными визуальными решениями | Смешанно[^17][^18] |

Особенно важен 21st.dev: это, по сути, готовый мост между "нашёл дизайн" и "перенёс в код" — каждый компонент сопровождается AI-ready промптом, который можно вставить прямо в Codex или аналогичный агент, без ручного описания стиля.[^16]

### Пошаговая стратегия переноса дизайна в приложение

1. **Скрининг референсов.** Пробежаться по SaaSUI/Land-book/21st.dev по нужной категории экрана (dashboard, pricing, onboarding) и отобрать 1-3 конкретных примера, а не абстрактное "красивый дизайн".[^13][^16]
2. **Зафиксировать визуальный источник истины.** Сделать скриншоты в разных состояниях — desktop/mobile, hover, empty, loading — а не только один "герой-кадр"; это прямая рекомендация из официального guide по Codex-дизайну.[^3]
3. **Передать референс и бриф Codex одним запросом.** Указать: где лежат токены и примитивы дизайн-системы в текущем проекте, какой конкретный экран/компонент меняем, что нельзя трогать.[^2][^3]
4. **Включить визуальную проверку (Playwright).** Codex рендерит правку в реальном браузере, сравнивает с референс-скриншотом на разных breakpoints и donext итерацию только после совпадения.[^10][^3]
5. **Итерировать точечно, а не глобально.** Сообщество отмечает, что "20-50x" ускорение в вайб-кодинге достигается не одним гигантским промптом, а вертикальными срезами: сначала фундамент (UI-библиотека типа shadcn), затем правила проекта в `.cursor/rules/`-аналоге для Codex, затем поэтапные правки.[^19]
6. **Держать прогресс в .md-файле.** Рабочий паттерн сообщества: отдельная модель (например Claude) генерирует исходный React-код дизайна, ChatGPT формирует детальный промпт-трансформацию с описанием стилей/тем/состояний и создаёт .md-файл трекинга, а затем этот пакет передаётся Codex, который воспроизводит дизайн и обновляет .md за один проход даже для крупного фронтенда.[^20]

### Готовый цикл "просмотрел → выбрал → запустил скилл → Codex сделал за 1-2 прохода"

Чтобы минимизировать ручной труд именно так, как описано в запросе, разумно собрать личный workflow из трёх частей:

- **Источник дизайна:** держать открытым 21st.dev (готовые AI-промпты для компонентов) и SaaSUI/Land-book (референсы по конкретным экранам) как основной "каталог", по которому пробегать глазами.[^13][^16]
- **Мост "дизайн → Codex":** для компонентов из 21st.dev — копировать готовый AI-prompt и вставлять в Codex; для скриншотов из галерей — использовать связку "делаю 2 скрина (viewport + full page) → отдаю Codex с фразой сохранить логику/токены, поменять только визуал".[^9][^1]
- **Скилл контроля качества:** держать включённым Playwright-скилл + либо кастомный скилл с Gemini-оценкой UI (как в примере из r/codex), либо frontend-design скилл от Vercel Labs, чтобы Codex сам итерировал до приемлемого результата за 1-2 внутренних цикла, прежде чем показывать финальный вариант.[^4][^9]

Такая связка закрывает оба запроса пользователя: скиллы Playwright + frontend-design/Codex-Skills дают безопасность правок без поломок, а связка галерей (21st.dev, SaaSUI, Land-book) с готовыми AI-промптами обеспечивает быстрый поиск и перенос дизайна с минимальным количеством ручных доработок.

---

## References

1. [Make granular UI changes | ChatGPT use cases](https://learn.chatgpt.com/use-cases/make-granular-ui-changes) - Use Codex to make one small UI adjustment at a time in an existing app, verify it in the browser, an...

2. [Frontend prompt instructions | OpenAI API](https://developers.openai.com/api/docs/guides/frontend-prompt) - - You make sure that the frontend design is tailored for the domain and subject matter of the applic...

3. [Build UI with OpenAI Codex](https://open-design.ai/agents/codex-design/) - OpenDesign turns Codex into a local-first, open-source design agent, your OpenAI key, your files, a ...

4. [Top 10 Codex Skills in 2026 (Tested With Real Use Cases)](https://composio.dev/content/top-codex-skills) - How to install: Open Codex. In the chat, tell Codex to install the frontend-slides skill. Paste this...

5. [Skills + 5.2 xhigh is unstoppable : r/codex](https://www.reddit.com/r/codex/comments/1prkrlv/skills_52_xhigh_is_unstoppable/) - Ever wanted to use Claude's Frontend-design skill on Codex? npx Ai-Agent-Skills install frontend-des...

6. [Codex-Skills - AI Agents on GitHub | SkillsLLM](https://skillsllm.com/skill/codex-skills) - Codex-first Agent Skills library for premium frontend, website, motion, accessibility, QA, and hando...

7. [Codex Skills for Design Engineers](https://www.ui-skills.com/agents/codex) - UI Skills helps you find the right skills depending on the current context so Codex can load the mos...

8. [skill-installer](https://smithery.ai/skills/openai/skill-installer) - Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a u...

9. [Anyone figure out how to do/improve designing UI with ...](https://www.reddit.com/r/codex/comments/1rns1py/anyone_figure_out_how_to_doimprove_designing_ui/) - I've tried Playwright and Impeccable and things like that but so far i can't get codex to create goo...

10. [Build responsive front-end designs | ChatGPT use cases](https://learn.chatgpt.com/use-cases/frontend-designs) - When you have screenshots, a short design brief, or a few references for inspiration, Codex can turn...

11. [Designing delightful frontends with GPT-5.4](https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4) - Practical techniques for steering GPT-5.4 toward polished, production-ready frontend designs.

12. [The Complete Vibe Coding Guide for Designers (2026)](https://muz.li/blog/the-complete-vibe-coding-guide-for-designers-2026/) - A practical guide to Vibe Coding in 2026: how to build AI-powered products that stay consistent, sca...

13. [Best SaaS UI Design Inspiration Sites (2026)](https://www.saasui.design/best-saas-ui-design-inspiration) - The best SaaS UI inspiration sites, compared · 1. SaaSUI · 2. SaaSFrame · 3. Saaspo · 4. Land-book ·...

14. [Mobbin — UI & UX design inspiration for mobile & web apps](https://mobbin.com/) - Mobbin is a game-changer for designers looking to step up their understanding of UX and UI design pa...

15. [Landbook - website design inspiration gallery](https://land-book.com/) - Find the best hand-picked website design inspiration. We're a curated website design gallery for Cre...

16. [21st.dev](https://21st.dev/) - The living library of interfaces. 12,000+ crafted React components, templates, and shadcn themes. Bu...

17. [13 Best Web Design Inspiration Sites (2026)](https://www.aidesigner.ai/blog/web-design-inspiration) - The best web design inspiration sites in 2026 are Awwwards, Dribbble, Behance, SiteInspire, Godly, a...

18. [UI Design Inspirations... 1. Mobbin 2. Godly 3. Awwwards 4 ...](https://www.threads.com/@uxui.heroes/post/DZtmGidjIyy/ui-design-inspirations-mobbin-godly-awwwards-land-book-lapa-ninja-refero-saa-s/) - 1. Mobbin 2. Godly 3. Awwwards 4. Land-book 5. Lapa Ninja 6. Refero 7. SaaS Frames · Hey Threads! · ...

19. [A Structured Workflow for "Vibe Coding" Full-Stack Apps](https://dev.to/wasp/a-structured-workflow-for-vibe-coding-full-stack-apps-352l) - With this workflow I could really build complex apps 20-50x faster than I could before. The fact tha...

20. [Has anyone learned ways to make @Codex better at UI / ...](https://www.reddit.com/r/codex/comments/1rx5wy7/has_anyone_learned_ways_to_make_codex_better_at/) - I’m a senior full-stack engineer building internal applications, and I’ve noticed something I can’t ...
