export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Business' | 'Academic' | 'Creative' | 'General';
  content: string;
  fontFamily: string;
  fontSize: string;
}

export const BUILT_IN_TEMPLATES: DocTemplate[] = [
  {
    id: 'tpl-blank',
    name: 'Новый документ',
    description: 'Начните с чистого листа.',
    category: 'General',
    fontFamily: 'Inter',
    fontSize: '16px',
    content: '<div><br></div>'
  },
  {
    id: 'tpl-letter',
    name: 'Деловое письмо',
    description: 'Классический профессиональный макет деловой переписки с полями, заголовками и подписью.',
    category: 'Business',
    fontFamily: 'Merriweather',
    fontSize: '15px',
    content: `
      <div style="font-family: Merriweather, Georgia, serif; line-height: 1.6; color: #1e293b;">
        <div style="text-align: right; margin-bottom: 2rem;">
          <p style="margin: 0; font-weight: bold;">Иван Иванов</p>
          <p style="margin: 0; font-size: 0.9em; color: #64748b;">ул. Новаторов, д. 10, оф. 400<br>Москва, 119391<br>ivanov@email.com</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
          <p style="margin: 0;">2 июля 2026 г.</p>
        </div>

        <div style="margin-bottom: 2rem;">
          <p style="margin: 0; font-weight: bold;">ООО "Инновации"</p>
          <p style="margin: 0; font-size: 0.9em; color: #64748b;">Кому: Отдел подбора персонала<br>Ленинградский проспект, д. 39<br>Москва, 125167</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <p style="margin: 0;">Уважаемые коллеги,</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <p style="margin: 0; text-indent: 2rem;">Я пишу, чтобы выразить свою заинтересованность в вакансии Ведущего менеджера проектов в компании "Инновации". Имея более восьми лет опыта руководства многофункциональными командами в сфере дизайна и технологий, я успешно реализовал программные проекты, которые увеличили вовлеченность пользователей более чем на 40% на международных рынках.</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <p style="margin: 0; text-indent: 2rem;">В моей текущей организации я возглавил модернизацию основной линейки продуктов, руководя 14 инженерами и 3 UI-дизайнерами. Мой подход основан на прозрачном общении, структурированных спринтах Scrum и глубоком кросс-функциональном взаимодействии. Я верю, что мой опыт точно соответствует целям развития вашей компании.</p>
        </div>

        <div style="margin-bottom: 2rem;">
          <p style="margin: 0;">Благодарю вас за ваше время и внимание к моей кандидатуре. Я буду рад возможности лично обсудить, как мой опыт может быть полезен для реализации стратегических задач компании "Инновации".</p>
        </div>

        <div>
          <p style="margin: 0 0 2.5rem 0;">С уважением,</p>
          <p style="margin: 0; font-weight: bold;">Иван Иванов</p>
          <p style="margin: 0; font-size: 0.9em; color: #64748b;">Ведущий консультант по проектированию интерфейсов</p>
        </div>
      </div>
    `
  },
  {
    id: 'tpl-minutes',
    name: 'Протокол совещания',
    description: 'Структурируйте встречи команды, фиксируйте ключевые решения и отслеживайте задачи участников.',
    category: 'Business',
    fontFamily: 'Inter',
    fontSize: '15px',
    content: `
      <div style="font-family: Inter, sans-serif; line-height: 1.5; color: #0f172a;">
        <h1 style="font-size: 1.8rem; font-weight: bold; color: #0284c7; margin-bottom: 0.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">Еженедельное планирование руководства</h1>
        <p style="font-style: italic; color: #64748b; margin-bottom: 1.5rem;">Дата: 2 июля 2026 г. | Время: 10:00 - 11:30 | Модератор: Анна Кузнецова</p>
        
        <h2 style="font-size: 1.25rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.5rem;">Участники</h2>
        <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: square;">
          <li>Анна Кузнецова (Руководитель продукта)</li>
          <li>Михаил Петров (Технический директор)</li>
          <li>Елена Ростова (Главный UX-архитектор)</li>
          <li>Дмитрий Ким (Продуктовый маркетинг)</li>
        </ul>

        <h2 style="font-size: 1.25rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.5rem;">1. Повестка дня и обсуждение</h2>
        <p style="margin-bottom: 0.5rem; font-weight: bold; color: #0369a1;">А. Финализация дорожной карты продукта на 3 квартал</p>
        <p style="margin-left: 1rem; margin-bottom: 1rem;">Елена продемонстрировала обновленные макеты Figma для мультидокументного рабочего пространства. Команда согласовала минималистичный дизайн холста для удобства пользователей. Михаил оценил инженерные трудозатраты в 3 недели, что позволяет нам придерживаться графика для выпуска альфа-версии в конце августа.</p>
        
        <p style="margin-bottom: 0.5rem; font-weight: bold; color: #0369a1;">Б. План миграции базы данных</p>
        <p style="margin-left: 1rem; margin-bottom: 1.5rem;">Михаил подтвердил, что схема PostgreSQL зафиксирована. Скрипты миграции будут выполнены на тестовом стенде в четверг вечером. Все данные пользователей обратно совместимы.</p>

        <h2 style="font-size: 1.25rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.5rem;">2. Принятые ключевые решения</h2>
        <ol style="margin-bottom: 1.5rem; padding-left: 1.5rem; list-style-type: decimal;">
          <li><strong>Утвердить</strong> минималистичный одноколоночный макет холста со стандартной панелью инструментов.</li>
          <li><strong>Отложить</strong> реализацию автономной синхронизации на Фазу 2 (середина сентября).</li>
          <li><strong>Использовать</strong> стандартный Web Crypto API для локальной защиты документов.</li>
        </ol>

        <h2 style="font-size: 1.25rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.5rem;">3. Задачи к выполнению</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem; margin-bottom: 1.5rem; font-size: 0.95em;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 0.5rem; border: 1px solid #cbd5e1;">Задача / Действие</th>
              <th style="padding: 0.5rem; border: 1px solid #cbd5e1; width: 150px;">Исполнитель</th>
              <th style="padding: 0.5rem; border: 1px solid #cbd5e1; width: 120px;">Срок</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1;">Передать финальные спецификации адаптивного макета холста в формате SVG</td>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1;">Елена Р.</td>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1; color: #b91c1c;">6 июля 2026 г.</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1;">Развернуть тестовые миграции PostgreSQL и провести тесты производительности</td>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1;">Михаил П.</td>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1; color: #b91c1c;">9 июля 2026 г.</td>
            </tr>
            <tr>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1;">Подготовить пресс-релиз и документацию для маркетинговой посадочной страницы</td>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1;">Дмитрий К.</td>
              <td style="padding: 0.5rem; border: 1px solid #cbd5e1;">15 июля 2026 г.</td>
            </tr>
          </tbody>
        </table>
      </div>
    `
  },
  {
    id: 'tpl-resume',
    name: 'Современное резюме',
    description: 'Элегантный макет резюме с хронологией опыта работы, контактными данными и матрицей навыков.',
    category: 'Business',
    fontFamily: 'Montserrat',
    fontSize: '14px',
    content: `
      <div style="font-family: Montserrat, Arial, sans-serif; line-height: 1.4; color: #334155;">
        <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #0f172a;">
          <h1 style="font-size: 2rem; font-weight: bold; color: #0f172a; margin: 0 0 0.25rem 0; letter-spacing: 1px;">ЕЛИЗАВЕТА КОЗЛОВА</h1>
          <p style="font-weight: 500; color: #64748b; margin: 0 0 0.5rem 0; letter-spacing: 2px;">ВЕДУЩИЙ UI/UX ДИЗАЙНЕР</p>
          <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Москва &bull; +7 (999) 123-45-67 &bull; kozlova@email.com &bull; github.com/ekozlova</p>
        </div>

        <h2 style="font-size: 1rem; font-weight: bold; color: #0f172a; margin-top: 1rem; margin-bottom: 0.5rem; letter-spacing: 1px;">О СЕБЕ</h2>
        <p style="margin-bottom: 1.25rem; font-size: 0.95em;">Увлеченный, ориентированный на детали дизайнер интерфейсов с более чем 6-летним опытом разработки адаптивных SaaS-платформ. Специализируюсь на создании систем дизайн-компонентов, соответствии требованиям доступности (WCAG AA) и современных CSS-фреймворках. Стремлюсь к гармонии функционального кода и эстетичного дизайна.</p>

        <h2 style="font-size: 1rem; font-weight: bold; color: #0f172a; margin-top: 1rem; margin-bottom: 0.5rem; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">ОПЫТ РАБОТЫ</h2>
        
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #0f172a;">
            <span>Ведущий UI-дизайнер &bull; Интех Решения</span>
            <span style="font-weight: normal; color: #64748b;">2023 - н. в.</span>
          </div>
          <ul style="margin: 0.25rem 0 0 0; padding-left: 1.25rem; font-size: 0.9em; list-style-type: disc;">
            <li>Разработала единую дизайн-систему, которая сократила время передачи макетов разработчикам на 35%.</li>
            <li>Сотрудничала с продуктовыми командами для проектирования интерфейсов аналитических дашбордов для 2M+ пользователей.</li>
            <li>Обучала младших инженеров применению современных методик верстки с использованием Tailwind CSS.</li>
          </ul>
        </div>

        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; color: #0f172a;">
            <span>Веб-дизайнер &bull; Пиксель Арт</span>
            <span style="font-weight: normal; color: #64748b;">2020 - 2023</span>
          </div>
          <ul style="margin: 0.25rem 0 0 0; padding-left: 1.25rem; font-size: 0.9em; list-style-type: disc;">
            <li>Проектировала интерактивные промо-страницы для крупных брендов из списка Fortune-500.</li>
            <li>Реорганизовала структуру мобильного приложения, увеличив конверсию в регистрацию на 18%.</li>
          </ul>
        </div>

        <h2 style="font-size: 1rem; font-weight: bold; color: #0f172a; margin-top: 1rem; margin-bottom: 0.5rem; letter-spacing: 1px; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.25rem;">НАВЫКИ</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
          <tr>
            <td style="padding: 0.25rem 0; font-weight: bold; width: 180px; color: #0f172a;">Проектирование:</td>
            <td style="padding: 0.25rem 0;">Дизайн-системы, Токены дизайна, Figma, Прототипирование, Интерактивные макеты</td>
          </tr>
          <tr>
            <td style="padding: 0.25rem 0; font-weight: bold; color: #0f172a;">Разработка/Код:</td>
            <td style="padding: 0.25rem 0;">HTML5, React, TypeScript, CSS Grid, Tailwind CSS, Sass, Git, Node.js</td>
          </tr>
          <tr>
            <td style="padding: 0.25rem 0; font-weight: bold; color: #0f172a;">Компетенции:</td>
            <td style="padding: 0.25rem 0;">Доступность интерфейсов WCAG, UX-аудит, Гибкие методологии Agile, Спринты</td>
          </tr>
        </table>
      </div>
    `
  },
  {
    id: 'tpl-chapter',
    name: 'Черновик главы книги',
    description: 'Элегантный макет с засечками для писателей, с комфортными полями и увеличенным межстрочным интервалом.',
    category: 'Creative',
    fontFamily: 'Cormorant Garamond',
    fontSize: '18px',
    content: `
      <div style="font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.8; color: #1e293b; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 3rem;">
          <p style="font-size: 1.1em; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 0.5rem; color: #64748b;">Глава четвертая</p>
          <h1 style="font-size: 2.2rem; font-style: italic; font-weight: normal; margin-top: 0; color: #0f172a;">Шепчущая галерея</h1>
          <p style="font-size: 1.5rem; color: #94a3b8; margin: 1rem 0;">&mdash; &diams; &mdash;</p>
        </div>

        <p style="text-indent: 0; font-size: 1.1em; margin-bottom: 1.5rem;"><span style="font-size: 2.2em; float: left; line-height: 0.8; padding-top: 4px; padding-right: 8px; font-weight: bold; font-family: Georgia, serif;">Д</span>ождь не прекращался, но ветер стих до тихого, мерного вздоха, омывающего черепичные крыши старой академии. Клара плотнее укутала шею шерстяной шалью, её шаги слишком гулко отдавались в пустом зале. Говорили, что если встать точно в фокусе сводчатой арки зала и произнести хотя бы тихий шепот, звук побежит по каменной кладке, преодолевая полмили до другого конца зала и не теряя своей отчетливости.</p>

        <p style="text-indent: 2rem; margin-bottom: 1.5rem;">Она держала свечу высоко, наблюдая, как тени пляшут по декоративным фигурам на стенах. В левой руке кожаный переплет дневника казался удивительно тяжелым, его замок оставался холодным и неподатливым под её пальцами. "Есть здесь кто-нибудь?" — прошептала она, повернувшись к кирпичной стене.</p>

        <p style="text-indent: 2rem; margin-bottom: 1.5rem;">На мгновение воцарилась тишина. Лишь вода с шумом стекала в водосточные решетки под высокими витражными окнами. Она уже собиралась повернуться, чувствуя легкое смущение от своей глупости, когда раздался ответ. Он прозвучал не из другого конца зала, а словно исходил прямо из кирпича рядом с её ухом — холодный и сухой, как шуршание старой бумаги.</p>

        <div style="text-align: center; margin: 2rem 0; font-style: italic; color: #64748b;">
          "Поверни ключ трижды по часовой стрелке, Клара, но не смотри на то, что освободится."
        </div>

        <p style="text-indent: 2rem; margin-bottom: 1.5rem;">Она замерла, дыхание перехватило в горле. Пламя свечи дрогнуло, отбрасывая длинные ломаные тени на потолок. Это был голос библиотекаря, она не сомневалась в этом. Но библиотекарь бесследно исчез во время весеннего равноденствия, ровно сорок дней назад.</p>
      </div>
    `
  },
  {
    id: 'tpl-checklist',
    name: 'Новый список',
    description: 'Создайте список задач, покупок или дел с интерактивными флажками.',
    category: 'General',
    fontFamily: 'Inter',
    fontSize: '16px',
    content: `
      <div style="font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1e293b;">
        <h2>Мой список задач</h2>
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem;">Нажмите на квадрат, чтобы отметить задачу как выполненную.</p>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
          <span style="font-size: 1.05rem;">Купить продукты на неделю</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
          <span style="font-size: 1.05rem;">Закончить оформление документа</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
          <span style="font-size: 1.05rem;">Сделать зарядку вечером</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <input type="checkbox" style="width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer;">
          <span style="font-size: 1.05rem;">Позвонить близким</span>
        </div>
        <div><br></div>
      </div>
    `
  }
];
