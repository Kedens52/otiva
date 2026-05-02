"use client"

import Link from "next/link"
import { useState } from "react"

type SubItem = { label: string; href: string }
type Group   = { title: string; href: string; items: SubItem[] }
type Category = {
  slug: string; title: string; emoji: string; description: string
  color: string; textColor: string; href: string; groups: Group[]
}

const ALL_CATEGORIES: Category[] = [
  {
    slug: "cars", title: "Транспорт", emoji: "🚗",
    description: "Автомобили, мотоциклы, спецтехника, запчасти",
    color: "bg-[hsl(var(--nashlo-mint)/0.12)]", textColor: "text-[hsl(var(--nashlo-mint))]",
    href: "/search?cat=cars",
    groups: [
      { title: "Легковые автомобили", href: "/search?cat=cars&vehicle_type=car", items: [
        { label: "С пробегом",          href: "/search?cat=cars&vehicle_type=car&condition=used" },
        { label: "Новые",               href: "/search?cat=cars&vehicle_type=car&condition=new" },
        { label: "Электромобили",       href: "/search?cat=cars&vehicle_type=car&fuel=electric" },
        { label: "Гибриды",             href: "/search?cat=cars&vehicle_type=car&fuel=hybrid" },
        { label: "Внедорожники / SUV",  href: "/search?cat=cars&vehicle_type=car&body_type=suv" },
        { label: "Седаны",              href: "/search?cat=cars&vehicle_type=car&body_type=sedan" },
        { label: "Универсалы",          href: "/search?cat=cars&vehicle_type=car&body_type=wagon" },
        { label: "Минивэны",            href: "/search?cat=cars&vehicle_type=car&body_type=minivan" },
      ]},
      { title: "Коммерческий транспорт", href: "/search?cat=cars&vehicle_type=commercial", items: [
        { label: "Грузовики",           href: "/search?cat=cars&vehicle_type=truck" },
        { label: "Фургоны",             href: "/search?cat=cars&vehicle_type=commercial&q=фургон" },
        { label: "Автобусы",            href: "/search?cat=cars&vehicle_type=commercial&q=автобус" },
        { label: "Спецтехника",         href: "/search?cat=cars&vehicle_type=special" },
        { label: "Прицепы",             href: "/search?cat=cars&vehicle_type=trailer" },
      ]},
      { title: "Мотоциклы и мототехника", href: "/search?cat=cars&vehicle_type=moto", items: [
        { label: "Мотоциклы",           href: "/search?cat=cars&vehicle_type=moto&subcategory=moto" },
        { label: "Скутеры",             href: "/search?cat=cars&vehicle_type=moto&subcategory=scooter" },
        { label: "Квадроциклы",         href: "/search?cat=cars&vehicle_type=moto&subcategory=quad" },
        { label: "Снегоходы",           href: "/search?cat=cars&vehicle_type=moto&subcategory=snowmobile" },
        { label: "Мопеды",              href: "/search?cat=cars&vehicle_type=moto&subcategory=moped" },
      ]},
      { title: "Запчасти и аксессуары", href: "/search?cat=cars&q=запчасти", items: [
        { label: "Шины и диски",        href: "/search?cat=cars&q=шины" },
        { label: "Кузовные детали",     href: "/search?cat=cars&q=кузов" },
        { label: "Двигатель и КПП",     href: "/search?cat=cars&q=двигатель" },
        { label: "Аудио / Мультимедиа", href: "/search?cat=cars&q=аудио" },
        { label: "Автохимия",           href: "/search?cat=cars&q=автохимия" },
        { label: "Инструменты",         href: "/search?cat=cars&q=инструменты" },
      ]},
    ],
  },
  {
    slug: "real-estate", title: "Недвижимость", emoji: "🏠",
    description: "Квартиры, дома, участки — продажа, аренда, посуточно",
    color: "bg-[hsl(var(--nashlo-blue)/0.1)]", textColor: "text-[hsl(var(--nashlo-blue))]",
    href: "/search?cat=real-estate",
    groups: [
      { title: "Продажа", href: "/search?cat=real-estate&deal_type=sell", items: [
        { label: "Квартиры",            href: "/search?cat=real-estate&deal_type=sell&property_type=apartment" },
        { label: "Комнаты",             href: "/search?cat=real-estate&deal_type=sell&property_type=room" },
        { label: "Дома и коттеджи",     href: "/search?cat=real-estate&deal_type=sell&property_type=house" },
        { label: "Дачи",                href: "/search?cat=real-estate&deal_type=sell&property_type=dacha" },
        { label: "Участки",             href: "/search?cat=real-estate&deal_type=sell&property_type=land" },
        { label: "Гаражи",              href: "/search?cat=real-estate&deal_type=sell&property_type=garage" },
        { label: "Коммерческая",        href: "/search?cat=real-estate&deal_type=sell&property_type=commercial" },
      ]},
      { title: "Аренда", href: "/search?cat=real-estate&deal_type=rent", items: [
        { label: "Квартиры",            href: "/search?cat=real-estate&deal_type=rent&property_type=apartment" },
        { label: "Комнаты",             href: "/search?cat=real-estate&deal_type=rent&property_type=room" },
        { label: "Дома",                href: "/search?cat=real-estate&deal_type=rent&property_type=house" },
        { label: "Офисы",               href: "/search?cat=real-estate&deal_type=rent&property_type=commercial" },
        { label: "Склады",              href: "/search?cat=real-estate&deal_type=rent&q=склад" },
      ]},
      { title: "Посуточно", href: "/search?cat=real-estate&deal_type=rent_daily", items: [
        { label: "Квартиры посуточно",  href: "/search?cat=real-estate&deal_type=rent_daily&property_type=apartment" },
        { label: "Дома посуточно",      href: "/search?cat=real-estate&deal_type=rent_daily&property_type=house" },
        { label: "Апартаменты",         href: "/search?cat=real-estate&deal_type=rent_daily&q=апартаменты" },
        { label: "Коттеджи",            href: "/search?cat=real-estate&deal_type=rent_daily&q=коттедж" },
      ]},
      { title: "Новостройки", href: "/search?cat=real-estate&property_type=new_build", items: [
        { label: "Все новостройки",     href: "/search?cat=real-estate&property_type=new_build" },
        { label: "Студии",              href: "/search?cat=real-estate&property_type=new_build&rooms=studio" },
        { label: "1-комнатные",         href: "/search?cat=real-estate&property_type=new_build&rooms=1" },
        { label: "2-комнатные",         href: "/search?cat=real-estate&property_type=new_build&rooms=2" },
        { label: "3-комнатные",         href: "/search?cat=real-estate&property_type=new_build&rooms=3" },
      ]},
    ],
  },
  {
    slug: "electronics", title: "Электроника", emoji: "📱",
    description: "Смартфоны, ноутбуки, ТВ, аудио, игровые консоли",
    color: "bg-[hsl(var(--nashlo-blue)/0.1)]", textColor: "text-[hsl(var(--nashlo-blue))]",
    href: "/search?cat=electronics",
    groups: [
      { title: "Телефоны и гаджеты", href: "/search?cat=electronics&subcategory=phones", items: [
        { label: "Смартфоны",           href: "/search?cat=electronics&subcategory=phones" },
        { label: "Планшеты",            href: "/search?cat=electronics&subcategory=tablets" },
        { label: "Умные часы",          href: "/search?cat=electronics&subcategory=wearables" },
        { label: "Наушники",            href: "/search?cat=electronics&subcategory=headphones" },
        { label: "Портативные колонки", href: "/search?cat=electronics&subcategory=audio" },
        { label: "Apple",               href: "/search?cat=electronics&brand=apple" },
        { label: "Samsung",             href: "/search?cat=electronics&brand=samsung" },
        { label: "Xiaomi",              href: "/search?cat=electronics&brand=xiaomi" },
      ]},
      { title: "Компьютеры", href: "/search?cat=electronics&subcategory=laptops", items: [
        { label: "Ноутбуки",            href: "/search?cat=electronics&subcategory=laptops" },
        { label: "Настольные ПК",       href: "/search?cat=electronics&subcategory=pc" },
        { label: "Мониторы",            href: "/search?cat=electronics&subcategory=monitors" },
        { label: "Комплектующие",       href: "/search?cat=electronics&subcategory=components" },
        { label: "Сетевое оборудование",href: "/search?cat=electronics&subcategory=network" },
        { label: "Принтеры и МФУ",      href: "/search?cat=electronics&q=принтер" },
      ]},
      { title: "ТВ и аудио", href: "/search?cat=electronics&subcategory=tv", items: [
        { label: "Телевизоры",          href: "/search?cat=electronics&subcategory=tv" },
        { label: "Аудиотехника",        href: "/search?cat=electronics&subcategory=audio" },
        { label: "Проекторы",           href: "/search?cat=electronics&q=проектор" },
        { label: "Акустика",            href: "/search?cat=electronics&q=акустика" },
      ]},
      { title: "Фото и игры", href: "/search?cat=electronics&subcategory=photo", items: [
        { label: "Фотоаппараты",        href: "/search?cat=electronics&subcategory=photo" },
        { label: "Видеокамеры",         href: "/search?cat=electronics&q=видеокамера" },
        { label: "PlayStation",         href: "/search?cat=electronics&subcategory=consoles&q=playstation" },
        { label: "Xbox",                href: "/search?cat=electronics&subcategory=consoles&q=xbox" },
        { label: "Nintendo Switch",     href: "/search?cat=electronics&subcategory=consoles&q=nintendo" },
      ]},
    ],
  },
  {
    slug: "home", title: "Дом и интерьер", emoji: "🛋️",
    description: "Мебель, техника, декор, инструменты, стройматериалы",
    color: "bg-[hsl(var(--nashlo-orange)/0.1)]", textColor: "text-[hsl(var(--nashlo-orange))]",
    href: "/search?cat=home",
    groups: [
      { title: "Мебель", href: "/search?cat=home&subcategory=furniture", items: [
        { label: "Диваны и кресла",     href: "/search?cat=home&subcategory=furniture&q=диван" },
        { label: "Кровати",             href: "/search?cat=home&subcategory=furniture&q=кровать" },
        { label: "Столы",               href: "/search?cat=home&subcategory=furniture&q=стол" },
        { label: "Шкафы",               href: "/search?cat=home&subcategory=furniture&q=шкаф" },
        { label: "Стеллажи",            href: "/search?cat=home&subcategory=furniture&q=стеллаж" },
        { label: "Детская мебель",      href: "/search?cat=home&subcategory=furniture&q=детская" },
        { label: "Офисная мебель",      href: "/search?cat=home&subcategory=furniture&q=офис" },
      ]},
      { title: "Бытовая техника", href: "/search?cat=home&subcategory=appliances", items: [
        { label: "Холодильники",        href: "/search?cat=home&subcategory=appliances&q=холодильник" },
        { label: "Стиральные машины",   href: "/search?cat=home&subcategory=appliances&q=стиральная" },
        { label: "Пылесосы",            href: "/search?cat=home&subcategory=appliances&q=пылесос" },
        { label: "Кондиционеры",        href: "/search?cat=home&subcategory=appliances&q=кондиционер" },
        { label: "Кухонная техника",    href: "/search?cat=home&subcategory=kitchen" },
      ]},
      { title: "Интерьер и декор", href: "/search?cat=home&subcategory=decor", items: [
        { label: "Освещение",           href: "/search?cat=home&subcategory=lighting" },
        { label: "Ковры и текстиль",    href: "/search?cat=home&subcategory=textiles" },
        { label: "Декор",               href: "/search?cat=home&subcategory=decor" },
        { label: "Посуда",              href: "/search?cat=home&q=посуда" },
        { label: "Сантехника",          href: "/search?cat=home&subcategory=plumbing" },
      ]},
      { title: "Дача и ремонт", href: "/search?cat=home&subcategory=garden", items: [
        { label: "Инструменты",         href: "/search?cat=home&subcategory=tools" },
        { label: "Садовая техника",     href: "/search?cat=home&subcategory=garden" },
        { label: "Стройматериалы",      href: "/search?cat=home&subcategory=repair" },
        { label: "Двери и окна",        href: "/search?cat=home&q=двери" },
        { label: "Напольные покрытия",  href: "/search?cat=home&q=ламинат" },
      ]},
    ],
  },
  {
    slug: "fashion", title: "Одежда и обувь", emoji: "👗",
    description: "Мужское, женское, детское — новые вещи и бренды",
    color: "bg-[hsl(var(--nashlo-orange)/0.1)]", textColor: "text-[hsl(var(--nashlo-orange))]",
    href: "/search?cat=fashion",
    groups: [
      { title: "Женское", href: "/search?cat=fashion&gender=women", items: [
        { label: "Верхняя одежда",      href: "/search?cat=fashion&gender=women&subcategory=outerwear" },
        { label: "Платья и юбки",       href: "/search?cat=fashion&gender=women&subcategory=dresses" },
        { label: "Блузки и топы",       href: "/search?cat=fashion&gender=women&subcategory=tops" },
        { label: "Обувь",               href: "/search?cat=fashion&gender=women&subcategory=shoes" },
        { label: "Сумки",               href: "/search?cat=fashion&gender=women&subcategory=bags" },
        { label: "Аксессуары",          href: "/search?cat=fashion&gender=women&subcategory=accessories" },
      ]},
      { title: "Мужское", href: "/search?cat=fashion&gender=men", items: [
        { label: "Куртки и пальто",     href: "/search?cat=fashion&gender=men&subcategory=outerwear" },
        { label: "Рубашки и футболки",  href: "/search?cat=fashion&gender=men&subcategory=tops" },
        { label: "Брюки и джинсы",      href: "/search?cat=fashion&gender=men&subcategory=bottoms" },
        { label: "Кроссовки",           href: "/search?cat=fashion&gender=men&subcategory=shoes" },
        { label: "Аксессуары",          href: "/search?cat=fashion&gender=men&subcategory=accessories" },
      ]},
      { title: "Детское", href: "/search?cat=fashion&gender=kids", items: [
        { label: "Одежда для малышей",  href: "/search?cat=fashion&gender=kids&age_group=0-3" },
        { label: "Школьная форма",      href: "/search?cat=fashion&gender=kids&q=школьная" },
        { label: "Обувь детская",       href: "/search?cat=fashion&gender=kids&subcategory=shoes" },
        { label: "Спортивная",          href: "/search?cat=fashion&gender=kids&subcategory=sport" },
      ]},
      { title: "Бренды и стиль", href: "/search?cat=fashion", items: [
        { label: "Nike / Adidas",       href: "/search?cat=fashion&q=nike" },
        { label: "Zara / H&M",          href: "/search?cat=fashion&q=zara" },
        { label: "Люксовые бренды",     href: "/search?cat=fashion&q=gucci" },
        { label: "Винтаж",              href: "/search?cat=fashion&q=винтаж" },
        { label: "Спортивная одежда",   href: "/search?cat=fashion&subcategory=sport" },
      ]},
    ],
  },
  {
    slug: "kids", title: "Детям", emoji: "🧸",
    description: "Игрушки, коляски, одежда, мебель и развитие",
    color: "bg-[hsl(var(--nashlo-mint)/0.12)]", textColor: "text-[hsl(var(--nashlo-mint))]",
    href: "/search?cat=kids",
    groups: [
      { title: "Транспорт и прогулки", href: "/search?cat=kids&subcategory=strollers", items: [
        { label: "Коляски",             href: "/search?cat=kids&subcategory=strollers" },
        { label: "Автокресла",          href: "/search?cat=kids&subcategory=car_seats" },
        { label: "Велосипеды",          href: "/search?cat=kids&subcategory=sport&q=велосипед" },
        { label: "Самокаты",            href: "/search?cat=kids&subcategory=sport&q=самокат" },
        { label: "Санки",               href: "/search?cat=kids&q=санки" },
      ]},
      { title: "Игрушки", href: "/search?cat=kids&subcategory=toys", items: [
        { label: "Игрушки 0–3 лет",     href: "/search?cat=kids&subcategory=toys&age_group=0-1" },
        { label: "Конструкторы",        href: "/search?cat=kids&subcategory=toys&q=конструктор" },
        { label: "Куклы",               href: "/search?cat=kids&subcategory=toys&q=кукла" },
        { label: "Настольные игры",     href: "/search?cat=kids&subcategory=toys&q=настольная" },
        { label: "Мягкие игрушки",      href: "/search?cat=kids&subcategory=toys&q=мягкая" },
      ]},
      { title: "Мебель и уход", href: "/search?cat=kids&subcategory=furniture", items: [
        { label: "Кроватки",            href: "/search?cat=kids&subcategory=furniture&q=кроватка" },
        { label: "Манежи",              href: "/search?cat=kids&q=манеж" },
        { label: "Стулья для кормления",href: "/search?cat=kids&q=стул для кормления" },
        { label: "Питание и уход",      href: "/search?cat=kids&subcategory=nutrition" },
      ]},
      { title: "Школа и развитие", href: "/search?cat=kids&subcategory=school", items: [
        { label: "Книги",               href: "/search?cat=kids&subcategory=books" },
        { label: "Школьные принадлежности",href: "/search?cat=kids&subcategory=school" },
        { label: "Развивающие игры",    href: "/search?cat=kids&q=развивающие" },
        { label: "Спорт для детей",     href: "/search?cat=kids&subcategory=sport" },
      ]},
    ],
  },
  {
    slug: "sport", title: "Спорт и отдых", emoji: "⚽",
    description: "Велосипеды, тренажёры, туризм, рыбалка, единоборства",
    color: "bg-[hsl(var(--nashlo-mint)/0.12)]", textColor: "text-[hsl(var(--nashlo-mint))]",
    href: "/search?cat=sport",
    groups: [
      { title: "Колёсный спорт", href: "/search?cat=sport&subcategory=bikes", items: [
        { label: "Велосипеды",          href: "/search?cat=sport&subcategory=bikes" },
        { label: "Горные велосипеды",   href: "/search?cat=sport&subcategory=bikes&q=горный" },
        { label: "Самокаты",            href: "/search?cat=sport&subcategory=scooters" },
        { label: "Гироскутеры",         href: "/search?cat=sport&subcategory=scooters&q=гироскутер" },
      ]},
      { title: "Фитнес", href: "/search?cat=sport&subcategory=fitness", items: [
        { label: "Тренажёры",           href: "/search?cat=sport&subcategory=fitness" },
        { label: "Гантели и гири",      href: "/search?cat=sport&q=гантели" },
        { label: "Коврики и йога",      href: "/search?cat=sport&q=коврик" },
        { label: "Беговые дорожки",     href: "/search?cat=sport&q=беговая дорожка" },
        { label: "Единоборства",        href: "/search?cat=sport&subcategory=martial" },
      ]},
      { title: "Зима и туризм", href: "/search?cat=sport&subcategory=skiing", items: [
        { label: "Лыжи",                href: "/search?cat=sport&subcategory=skiing&q=лыжи" },
        { label: "Сноуборды",           href: "/search?cat=sport&subcategory=skiing&q=сноуборд" },
        { label: "Туризм и кемпинг",    href: "/search?cat=sport&subcategory=tourism" },
        { label: "Палатки",             href: "/search?cat=sport&subcategory=tourism&q=палатка" },
        { label: "Рюкзаки",             href: "/search?cat=sport&subcategory=tourism&q=рюкзак" },
      ]},
      { title: "Рыбалка и вода", href: "/search?cat=sport&subcategory=fishing", items: [
        { label: "Удочки и снасти",     href: "/search?cat=sport&subcategory=fishing" },
        { label: "Охота",               href: "/search?cat=sport&subcategory=hunting" },
        { label: "Лодки",               href: "/search?cat=sport&subcategory=water&q=лодка" },
        { label: "Каяки и SUP",         href: "/search?cat=sport&subcategory=water&q=каяк" },
      ]},
    ],
  },
  {
    slug: "services", title: "Услуги", emoji: "🔧",
    description: "Ремонт, уборка, IT, юристы, красота, репетиторы",
    color: "bg-[hsl(var(--nashlo-orange)/0.1)]", textColor: "text-[hsl(var(--nashlo-orange))]",
    href: "/search?cat=services",
    groups: [
      { title: "Дом и ремонт", href: "/search?cat=services&subcategory=repair_home", items: [
        { label: "Ремонт квартир",      href: "/search?cat=services&subcategory=repair_home" },
        { label: "Сантехника",          href: "/search?cat=services&subcategory=plumbing" },
        { label: "Электрика",           href: "/search?cat=services&subcategory=electrical" },
        { label: "Уборка",              href: "/search?cat=services&subcategory=cleaning" },
        { label: "Грузчики / Переезды", href: "/search?cat=services&subcategory=moving" },
      ]},
      { title: "IT и бизнес", href: "/search?cat=services&subcategory=it", items: [
        { label: "Разработка сайтов",   href: "/search?cat=services&subcategory=it&q=сайт" },
        { label: "Дизайн и реклама",    href: "/search?cat=services&subcategory=design" },
        { label: "Юридические",         href: "/search?cat=services&subcategory=legal" },
        { label: "Бухгалтерия",         href: "/search?cat=services&subcategory=accounting" },
        { label: "SEO / Маркетинг",     href: "/search?cat=services&subcategory=design&q=seo" },
      ]},
      { title: "Красота и здоровье", href: "/search?cat=services&subcategory=beauty", items: [
        { label: "Парикмахеры",         href: "/search?cat=services&subcategory=beauty&q=парикмахер" },
        { label: "Маникюр",             href: "/search?cat=services&subcategory=beauty&q=маникюр" },
        { label: "Массаж",              href: "/search?cat=services&subcategory=beauty&q=массаж" },
        { label: "Фитнес-тренеры",      href: "/search?cat=services&subcategory=beauty&q=тренер" },
        { label: "Ветеринария",         href: "/search?cat=services&subcategory=vet" },
      ]},
      { title: "Обучение и фото", href: "/search?cat=services&subcategory=tutor", items: [
        { label: "Репетиторы",          href: "/search?cat=services&subcategory=tutor" },
        { label: "Онлайн-курсы",        href: "/search?cat=services&subcategory=tutor&service_type=remote" },
        { label: "Фотографы",           href: "/search?cat=services&subcategory=photo_video&q=фотограф" },
        { label: "Автосервис",          href: "/search?cat=services&subcategory=auto_service" },
      ]},
    ],
  },
  {
    slug: "jobs", title: "Работа", emoji: "💼",
    description: "Вакансии, резюме, подработка, фриланс",
    color: "bg-[hsl(220,80%,96%)]", textColor: "text-[hsl(220,70%,50%)]",
    href: "/search?cat=jobs",
    groups: [
      { title: "Офис и менеджмент", href: "/search?cat=jobs&subcategory=office", items: [
        { label: "Менеджеры",           href: "/search?cat=jobs&q=менеджер" },
        { label: "Бухгалтерия",         href: "/search?cat=jobs&q=бухгалтер" },
        { label: "Юристы",              href: "/search?cat=jobs&q=юрист" },
        { label: "HR и кадры",          href: "/search?cat=jobs&q=hr" },
        { label: "Администраторы",      href: "/search?cat=jobs&q=администратор" },
      ]},
      { title: "IT и технологии", href: "/search?cat=jobs&q=it", items: [
        { label: "Разработчики",        href: "/search?cat=jobs&q=разработчик" },
        { label: "Дизайнеры",           href: "/search?cat=jobs&q=дизайнер" },
        { label: "Тестировщики",        href: "/search?cat=jobs&q=тестировщик" },
        { label: "Аналитики",           href: "/search?cat=jobs&q=аналитик" },
      ]},
      { title: "Рабочие и производство", href: "/search?cat=jobs&q=рабочий", items: [
        { label: "Строители",           href: "/search?cat=jobs&q=строитель" },
        { label: "Водители",            href: "/search?cat=jobs&q=водитель" },
        { label: "Склад и логистика",   href: "/search?cat=jobs&q=склад" },
        { label: "Охрана",              href: "/search?cat=jobs&q=охрана" },
      ]},
      { title: "Удалённая работа", href: "/search?cat=jobs&employment_type=remote", items: [
        { label: "Фриланс",             href: "/search?cat=jobs&employment_type=remote&q=фриланс" },
        { label: "Копирайтинг",         href: "/search?cat=jobs&q=копирайтер" },
        { label: "Переводы",            href: "/search?cat=jobs&q=переводчик" },
        { label: "SMM / Маркетинг",     href: "/search?cat=jobs&q=smm" },
      ]},
    ],
  },
  {
    slug: "animals", title: "Животные", emoji: "🐾",
    description: "Собаки, кошки, птицы, рыбки, корм и аксессуары",
    color: "bg-[hsl(30,90%,95%)]", textColor: "text-[hsl(25,80%,50%)]",
    href: "/search?cat=animals",
    groups: [
      { title: "Собаки", href: "/search?cat=animals&subcategory=dogs", items: [
        { label: "Щенки",               href: "/search?cat=animals&subcategory=dogs&q=щенок" },
        { label: "Взрослые собаки",     href: "/search?cat=animals&subcategory=dogs" },
        { label: "Вязка",               href: "/search?cat=animals&subcategory=dogs&q=вязка" },
        { label: "Аксессуары",          href: "/search?cat=animals&subcategory=dogs&q=аксессуары" },
      ]},
      { title: "Кошки", href: "/search?cat=animals&subcategory=cats", items: [
        { label: "Котята",              href: "/search?cat=animals&subcategory=cats&q=котёнок" },
        { label: "Взрослые кошки",      href: "/search?cat=animals&subcategory=cats" },
        { label: "Вязка",               href: "/search?cat=animals&subcategory=cats&q=вязка" },
      ]},
      { title: "Другие животные", href: "/search?cat=animals", items: [
        { label: "Птицы",               href: "/search?cat=animals&subcategory=birds" },
        { label: "Рыбки и аквариумы",   href: "/search?cat=animals&subcategory=fish" },
        { label: "Грызуны",             href: "/search?cat=animals&subcategory=rodents" },
        { label: "Рептилии",            href: "/search?cat=animals&subcategory=reptiles" },
      ]},
      { title: "Товары для животных", href: "/search?cat=animals&subcategory=food", items: [
        { label: "Корм",                href: "/search?cat=animals&q=корм" },
        { label: "Лежанки и клетки",    href: "/search?cat=animals&q=клетка" },
        { label: "Ветеринария",         href: "/search?cat=animals&subcategory=vet" },
        { label: "Стрижка и уход",      href: "/search?cat=animals&q=стрижка" },
      ]},
    ],
  },
  {
    slug: "hobby", title: "Хобби", emoji: "🎨",
    description: "Книги, музыка, коллекционирование, творчество, игры",
    color: "bg-[hsl(270,80%,97%)]", textColor: "text-[hsl(270,60%,55%)]",
    href: "/search?cat=hobby",
    groups: [
      { title: "Книги и медиа", href: "/search?cat=hobby&subcategory=books", items: [
        { label: "Книги",               href: "/search?cat=hobby&subcategory=books" },
        { label: "Журналы",             href: "/search?cat=hobby&q=журнал" },
        { label: "Музыкальные CD",      href: "/search?cat=hobby&q=cd" },
        { label: "Видеоигры",           href: "/search?cat=hobby&q=игра" },
      ]},
      { title: "Музыка", href: "/search?cat=hobby&subcategory=music", items: [
        { label: "Гитары",              href: "/search?cat=hobby&subcategory=music&q=гитара" },
        { label: "Пианино и синтезаторы",href: "/search?cat=hobby&subcategory=music&q=пианино" },
        { label: "Ударные",             href: "/search?cat=hobby&subcategory=music&q=барабаны" },
        { label: "DJ-оборудование",     href: "/search?cat=hobby&subcategory=music&q=dj" },
      ]},
      { title: "Коллекционирование", href: "/search?cat=hobby&subcategory=games", items: [
        { label: "Монеты",              href: "/search?cat=hobby&q=монеты" },
        { label: "Марки",               href: "/search?cat=hobby&q=марки" },
        { label: "Антиквариат",         href: "/search?cat=hobby&q=антиквариат" },
        { label: "Настольные игры",     href: "/search?cat=hobby&q=настольная игра" },
      ]},
      { title: "Творчество и рукоделие", href: "/search?cat=hobby&subcategory=art", items: [
        { label: "Рисование",           href: "/search?cat=hobby&subcategory=art&q=рисование" },
        { label: "Вышивка и вязание",   href: "/search?cat=hobby&subcategory=handmade" },
        { label: "Лепка",               href: "/search?cat=hobby&q=лепка" },
        { label: "Фотооборудование",    href: "/search?cat=hobby&subcategory=photo" },
      ]},
    ],
  },
  {
    slug: "other", title: "Другое", emoji: "📦",
    description: "Всё, что не вошло в другие категории",
    color: "bg-zinc-100", textColor: "text-zinc-600",
    href: "/search?cat=other",
    groups: [
      { title: "Разное", href: "/search?cat=other", items: [
        { label: "Все объявления",      href: "/search?cat=other" },
        { label: "Бесплатно",           href: "/search?cat=other&priceMax=0" },
        { label: "Обмен",               href: "/search?cat=other&q=обмен" },
        { label: "Подарки",             href: "/search?cat=other&q=подарок" },
      ]},
      { title: "Услуги и прочее", href: "/search?cat=other&q=услуги", items: [
        { label: "Аренда вещей",        href: "/search?cat=other&q=аренда" },
        { label: "Ремонт и мастера",    href: "/search?cat=other&q=ремонт" },
        { label: "Промышленное",        href: "/search?cat=other&q=промышленное" },
        { label: "Сырьё и материалы",   href: "/search?cat=other&q=материалы" },
      ]},
    ],
  },
]

// ── Accordion category (mobile) ──────────────────────────────────────────────
function CategoryAccordion({ cat }: { cat: Category }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-zinc-50"
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${cat.color}`}>
          {cat.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-950">{cat.title}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">{cat.description}</p>
        </div>
        <span className={`shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>›</span>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3">
          {/* "Все объявления" link */}
          <Link
            href={cat.href}
            className={`mb-4 block text-sm font-semibold ${cat.textColor} hover:underline`}
          >
            Все объявления в категории →
          </Link>

          {/* Groups as flat sections */}
          <div className="space-y-4">
            {cat.groups.map((group) => (
              <div key={group.title}>
                <Link href={group.href} className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-700">
                  {group.title}
                </Link>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-sm text-zinc-700 hover:text-zinc-950"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 pb-28 lg:pb-10 lg:py-10">

      {/* Hero */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-800 to-[hsl(var(--nashlo-orange))] p-5 text-white sm:p-8 lg:mb-10 lg:p-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Все категории</h1>
        <p className="mt-2 text-sm leading-6 text-white/70 sm:mt-3 sm:text-base">
          Выберите раздел и найдите нужное среди тысяч объявлений
        </p>
        {/* Quick chips — horizontal scroll on mobile */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ALL_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={c.href}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition active:bg-white/25 hover:bg-white/25"
            >
              <span>{c.emoji}</span>
              <span>{c.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── MOBILE: accordion list ─────────────────────────────────────────── */}
      <div className="space-y-2 lg:hidden">
        {ALL_CATEGORIES.map((cat) => (
          <CategoryAccordion key={cat.slug} cat={cat} />
        ))}
      </div>

      {/* ── DESKTOP: full grid ────────────────────────────────────────────── */}
      <div className="hidden space-y-10 lg:block">
        {ALL_CATEGORIES.map((cat) => (
          <section key={cat.slug} id={cat.slug}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl ${cat.color}`}>
                  {cat.emoji}
                </span>
                <div>
                  <Link href={cat.href} className="text-2xl font-semibold text-zinc-950 hover:underline underline-offset-2">
                    {cat.title} ›
                  </Link>
                  <p className="mt-0.5 text-sm text-zinc-500">{cat.description}</p>
                </div>
              </div>
              <Link
                href={cat.href}
                className="shrink-0 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-950 hover:text-white"
              >
                Все объявления
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {cat.groups.map((group) => (
                <div key={group.title} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <Link href={group.href} className={`mb-3 block text-sm font-semibold transition hover:underline underline-offset-2 ${cat.textColor}`}>
                    {group.title} ›
                  </Link>
                  <ul className="space-y-2">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <Link href={item.href} className="text-sm text-zinc-600 transition hover:text-zinc-950">
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
