import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse as dateFnsParse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Localizer setup
const locales = {
  "en-US": enUS,
  
};
const localizer = dateFnsLocalizer({
  format,
  parse: dateFnsParse,
  startOfWeek: (date, options) =>
    startOfWeek(date, { weekStartsOn: 1, ...options }),
  getDay,
  locales,
});

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasExplicitTime = (value) =>
  typeof value === "string" ? value.includes("T") : Boolean(value);

export default function CalendarView({
  records,
  currentDate,
  setCurrentDate,
  currentView,
  setCurrentView,
}) {
  const events = records
    .map((r) => {
      const startDate = parseDate(r.start);
      const endDate = parseDate(r.end);
      if (!startDate || !endDate) return null;
      const startHasTime = hasExplicitTime(r.start);
      const endHasTime = hasExplicitTime(r.end);
      return {
        id: r.id,
        title: `${r.name} - ${r.type} ${r.type === "Vacation" ? "🌴" : "✈️"}`,
        start: startDate,
        end: endDate,
        allDay: !(startHasTime || endHasTime),
        type: r.type,
      };
    })
    .filter(Boolean);

  return (
    <div className="bg-white p-6 rounded-2xl shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2 dark:text-gray-200">
        📅 Calendar View
      </h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        date={currentDate}
        onNavigate={(date) => setCurrentDate(date)}
        view={currentView}
        onView={(view) => setCurrentView(view)}
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        className="rounded-xl border border-gray-200 bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.type === "Vacation" ? "#22c55e" : "#3b82f6",
            color: "white",
            borderRadius: "8px",
            padding: "2px 4px",
          },
        })}
      />
    </div>
  );
}
