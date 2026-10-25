import { WeekSchedule } from '../types';

export const OFFICIAL_SCHEDULE_TEXT = `	02/11	03/11	04/11	05/11	06/11	07/11	08/11
	LUNES	MARTES	MIERCOLES	JUEVES	VIERNES	SABADO	DOMINGO
XISCO	M	M	M	M	L	L	10:00-18:00
ALIZ	L	M	M	T	M	M	L
OSCAR	L	L	N	N	N	N	N
MIRIAM	M	L	L	M	M	10:00-18:00	07:00-15:00
JOSEP	T	T	T	L	L	T	T
JAVI	M	M	M	M	M	L	L
TONI	BP	BP	BP	BP	BP	BP	BP
INES	T	T	L	L	T	AP	M
CARLOS	N	N	L	L	T	T	T
JAKELINE	L	L	T	T	10:00-18:00	M	M`;

export const OFFICIAL_WEEK_SCHEDULE: Partial<WeekSchedule> = {
  id: 'sched-2026-11-02',
  weekStartDate: '2026-11-02',
  weekEndDate: '2026-11-08',
  weekLabel: 'SEMANA DEL 02/11 AL 08/11 DE 2026',
  status: 'published',
  version: 1,
  publishedBy: 'Administrador Principal (Xisco G. H.)',
  changeReason: 'Cuadrante oficial de la plantilla para la semana del 2 al 8 de noviembre 2026',
  rawInputText: OFFICIAL_SCHEDULE_TEXT,
};
