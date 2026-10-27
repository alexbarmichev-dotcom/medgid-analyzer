import {useEffect, type ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import InstallBanner from "@/components/site/InstallBanner";
import NotFound from "@/pages/NotFound";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import appCss from "@/index.css?url";

const TITLE = "ЛабГид — расшифровка анализов онлайн простым языком | лаб-гид.рф";
const DESCRIPTION =
    "ЛабГид объясняет каждый показатель простым языком, оценивает отклонения от нормы и готовит список вопросов для врача. ";
const OG_IMAGE = "https://cdn.poehali.dev/projects/***/files/og-image-1786751594510.jpg";

const METRIKA_MAIN = `(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=111827030', 'ym');
ym(111827030, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`;

const METRIKA_PLATFORM = `(function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments) };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) { return; } }
    k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(101026698, "init", { trustedDomains: ["poehali.dev"], clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true, trackHash: true });`;

const LD_WEBPAGE = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: "ЛабГид — расшифровка анализов онлайн",
    url: "https://лаб-гид.рф/",
    description:
        "Расшифровка анализов крови и мочи онлайн с помощью ИИ. Объясняем каждый показатель простым языком, оцениваем отклонения от нормы и готовим список вопросов для врача.",
    inLanguage: "ru-RU",
    publisher: {
        "@type": "Organization",
        name: "ЛабГид",
        alternateName: ["Лаб Гид", "Лаб-Гид", "лабгид", "лаб гид", "лаб-гид"],
        url: "https://лаб-гид.рф/",
        logo: "https://cdn.poehali.dev/projects/***/bucket/4f83188a-9df1-4eba-ac26-2ef05362e375.jpg",
    },
};

const LD_FAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
        {
            "@type": "Question",
            name: "Как получить расшифровку анализов?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Войдите в личный кабинет, укажите пол, возраст и загрузите фото или скан анализа — ИИ подготовит расшифровку в течение минуты.",
            },
        },
        {
            "@type": "Question",
            name: "Мои данные в безопасности?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Все данные хранятся на серверах в России в соответствии с 152-ФЗ и доступны только вам по вашему логину.",
            },
        },
        {
            "@type": "Question",
            name: "Можно ли посмотреть историю прошлых обращений?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Да, в личном кабинете есть раздел «Ваша медицинская история» со всеми предыдущими расшифровками.",
            },
        },
        {
            "@type": "Question",
            name: "Сколько стоит расшифровка анализов?",
            acceptedAnswer: {
                "@type": "Answer",
                text: "Разбор одного анализа стоит 150 рублей, оплата один раз и без скрытых платежей. Также доступна подписка на 12 месяцев с историей анализов, графиками динамики и AI-чатом.",
            },
        },
    ],
};

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {
                name: "keywords",
                content:
                    "расшифровка анализов, анализ крови онлайн, что означают показатели анализов, расшифровка анализов онлайн, норма анализов, подготовка к врачу, лабгид",
            },
            {name: "author", content: "ЛабГид"},
            {name: "robots", content: "index, follow"},
            {name: "theme-color", content: "#F2EEE4"},
            {name: "mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-title", content: "ЛабГид"},
            {property: "og:type", content: "website"},
            {property: "og:url", content: "https://лаб-гид.рф/"},
            {property: "og:site_name", content: "ЛабГид"},
            {property: "og:locale", content: "ru_RU"},
            {property: "og:title", content: TITLE},
            {property: "og:description", content: DESCRIPTION},
            {property: "og:image", content: OG_IMAGE},
            {property: "og:image:width", content: "1200"},
            {property: "og:image:height", content: "630"},
            {name: "twitter:card", content: "summary_large_image"},
            {name: "twitter:title", content: "ЛабГид — расшифровка анализов онлайн простым языком"},
            {
                name: "twitter:description",
                content: "Расшифровка анализов крови и мочи онлайн с помощью ИИ. Объясняем каждый показатель простым языком.",
            },
            {name: "twitter:image", content: OG_IMAGE},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;800&family=Caveat:wght@600;700&family=Golos+Text:wght@400;500;600;700&display=swap",
            },
            {rel: "icon", type: "image/svg+xml", href: "/favicon.svg"},
            {rel: "manifest", href: "/manifest.webmanifest"},
            {rel: "apple-touch-icon", href: "/apple-touch-icon.png"},
        ],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
            {children: METRIKA_MAIN},
            {children: METRIKA_PLATFORM},
            {type: "application/ld+json", children: JSON.stringify(LD_WEBPAGE)},
            {type: "application/ld+json", children: JSON.stringify(LD_FAQ)},
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

function RootComponent() {
    useEffect(() => {
        if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
        const register = () => {
            navigator.serviceWorker.register("/sw.js").catch(() => undefined);
        };
        if (document.readyState === "complete") {
            register();
            return;
        }
        window.addEventListener("load", register);
        return () => window.removeEventListener("load", register);
    }, []);

    return (
        <RootDocument>
            <TooltipProvider>
                <Toaster/>
                <Sonner/>
                <Outlet/>
                <InstallBanner/>
            </TooltipProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <Scripts/>
        </body>
        </html>
    );
}
