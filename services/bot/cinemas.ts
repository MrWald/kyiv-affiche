import { compact, reduce, sortBy, uniq } from 'lodash';
import moment from 'moment';
import { asyncReq, Log, RN, RN2 } from 'utils';
import { ICinema, ICinemaSession } from 'services/bot/types';
const log = Log('cinemas.cinemas');

export const getCinemasData = async (): Promise<ICinema[]> => {
  log.debug('getting cinemas data');
  const { data } = await asyncReq<ICinema[]>({
    url: 'https://ewom32k72a.execute-api.us-east-1.amazonaws.com/dev/cinemas',
    json: true,
  });
  log.debug('getting cinemas data done');
  log.trace('length=', data.length, 'cinemas=', data);
  return data;
};

export const moviesListFromCinemasData = (cinemas: ICinema[]): string[] => {
  const res: string[] = [];
  for (const cinema of cinemas) {
    for (const movie of cinema.movies) {
      res.push(movie.title.local);
    }
  }
  return uniq(res);
};

const moviePriorityFromCinemas = (title: string, cinemas: ICinema[]): number => {
  let sessionsCount = 0;
  for (const cinema of cinemas) {
    const movie = cinema.movies.find((item) => item.title.local === title);
    if (movie) {
      sessionsCount += movie.sessions.length;
    }
  }
  return sessionsCount;
};

// Text

interface IMoviesMsg {
  priority: number;
  msg: string;
}

export const cinemsDataToMsg = (cinemas: ICinema[]): string => {
  const titles = moviesListFromCinemasData(cinemas);
  const moviesMsg: IMoviesMsg[] = [];
  for (const title of titles) {
    const msg = getMovieMsg(title, cinemas);
    if (msg) {
      const priority = moviePriorityFromCinemas(title, cinemas);
      moviesMsg.push({msg, priority});
    }
  }
  const sortMoviesMsg = sortBy(moviesMsg, ({priority}) => -priority);
  return reduce(sortMoviesMsg, (memo, {msg}) => (
    memo ? `${memo}${RN2}${msg}` : msg
  ), '');
};

const getMovieMsg = (title: string, cinemas: ICinema[]): string | null => {
  if (!title) { return null; }
  let str = `🍿 *${title}*`;
  for (const cinema of cinemas) {
    const cStr = cinemaToMovieMsg(title, cinema);
    if (cStr) { str = `${str}${RN2}${cStr}`; }
  }
  return str;
};

const cinemaToMovieMsg = (title: string, cinema: ICinema): string | null => {
  const { title: cTitle, movies: cMovies } = cinema;
  const movie = cMovies.find((item) => item.title.local === title);
  if (!movie) { return null; }
  const { sessions } = movie;
  const str = sessionToStr(sessions);
  if (!str) { return null; }
  const formats = sessionsToFormatStr(sessions);
  return !formats ? `🎥 ${cTitle}${RN}${str}` : `🎥 ${cTitle} (${formats})${RN}${str}`;
};

const sessionsToFormatStr = (sessions: ICinemaSession[]): string | null => {
  if (!sessions.length) { return null; }
  const formats = uniq(compact(sessions.map((item) => (item.format ? item.format.toUpperCase() : item.format))));
  if (!formats.length) { return null; }
  const sortFormats = formats.sort((a, b) => a > b ? 1 : -1);
  return reduce(sortFormats, (memo, str) => (memo ? `${memo}/${str}` : str),  '');
};

const sessionToStr = (sessions: ICinemaSession[]): string => {
  let str: string = '';
  const sortItems = sortBy(sessions, ({date}) => new Date(date).getTime());
  const strItems = uniq(sortItems.map(({ date }) => dateStrToTime(date)));
  for (const item of strItems) {
    str = str ? `${str}, \`${item}\`` : `\`${item}\``;
  }
  return `🕒 ${str}`;
};

const dateStrToTime = (val: string) => (
  moment(val).format('HH:mm')
);
