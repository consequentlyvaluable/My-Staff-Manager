import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse as dateFnsParse, startOfWeek, getDay } from "date-fns";
import { parseISO } from "date-fns";
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

export default function CalendarView({
  records,
  currentDate,
  setCurrentDate,
  currentView,
  setCurrentView,
}) {
  const events = records
    .filter((r) => r.start && r.end)
    .map((r) => ({
      id: r.id,
      title: `${r.name} - ${r.type} ${r.type === "Vacation" ? "🌴" : "✈️"}`,
      start: parseISO(r.start),
      end: parseISO(r.end),
      allDay: false,
      type: r.type,
    }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
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
