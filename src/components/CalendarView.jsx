import {
  Calendar,
  dateFnsLocalizer,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, parse as dateFnsParse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

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

const DragAndDropCalendar = withDragAndDrop(Calendar);

export default function CalendarView({
  records,
  currentDate,
  setCurrentDate,
  currentView,
  setCurrentView,
  onEventDrop,
  onEventResize,
  canModifyEmployee = () => true,
  allowEventEditing = true,
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
        employeeLabel: r.name,
        title: `${r.name} - ${r.type} ${r.type === "Vacation" ? "🌴" : "✈️"}`,
        start: startDate,
        end: endDate,
        allDay: !(startHasTime || endHasTime),
        type: r.type,
      };
    })
    .filter(Boolean);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white p-6 rounded-2xl shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2 dark:text-gray-200">
          📅 Calendar View
        </h2>
        <DragAndDropCalendar
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
          step={30}
          timeslots={2}
          min={new Date(1970, 1, 1, 6, 0)}
          max={new Date(1970, 1, 1, 22, 0)}
          className="rounded-xl border border-gray-200 bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.type === "Vacation" ? "#22c55e" : "#3b82f6",
              color: "white",
              borderRadius: "8px",
              padding: "2px 4px",
            },
          })}
          onEventDrop={allowEventEditing ? onEventDrop : undefined}
          onEventResize={allowEventEditing ? onEventResize : undefined}
          resizable={
            allowEventEditing ? { start: true, end: true } : false
          }
          draggableAccessor={(event) =>
            allowEventEditing && canModifyEmployee(event.employeeLabel)
          }
          resizableAccessor={(event) =>
            allowEventEditing && canModifyEmployee(event.employeeLabel)
          }
        />
      </div>
    </DndProvider>
  );
}
