import { reduce, sortBy, uniq } from 'lodash';
import moment from 'moment';
import { asyncReq, Log, RN, RN2 } from 'utils';
import { ITheatre } from 'services/bot/types';
const log = Log('cinemas.cinemas');

export const getCinemasData = async (): Promise<ITheatre[]> => {
  log.debug('getting cinemas data');
  const { data } = await asyncReq<ITheatre[]>({
    url: 'https://ewom32k72a.execute-api.us-east-1.amazonaws.com/dev/cinemas',
    json: true,
  });
  log.debug('getting cinemas data done');
  log.trace('length=', data.length, 'cinemas=', data);
  return data;
};

export const moviesListFromCinemasData = (cinemas: ITheatre[]): string[] => {
  const res: string[] = [];
  for (const cinema of cinemas) {
    for (const movie of cinema.performances) {
      res.push(movie.name);
    }
  }
  return uniq(res);
};

const moviePriorityFromCinemas = (title: string, cinemas: ITheatre[]): number => {
  let sessionsCount = 0;
  for (const cinema of cinemas) {
    const movie = cinema.performances.find((item) => item.name === title);
    if (movie) {
      sessionsCount += movie.dates.length;
    }
  }
  return sessionsCount;
};

// Text

interface IMoviesMsg {
  priority: number;
  msg: string;
}

export const cinemsDataToMsg = (cinemas: ITheatre[]): string => {
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

const getMovieMsg = (title: string, cinemas: ITheatre[]): string | null => {
  if (!title) { return null; }
  let str = `🍿 *${title}*`;
  for (const cinema of cinemas) {
    const cStr = cinemaToMovieMsg(title, cinema);
    if (cStr) { str = `${str}${RN2}${cStr}`; }
  }
  return str;
};

const cinemaToMovieMsg = (title: string, cinema: ITheatre): string | null => {
  const { name: cTitle, performances: cMovies } = cinema;
  const movie = cMovies.find((item) => item.name === title);
  if (!movie) { return null; }
  const { dates } = movie;
  const str = sessionToStr(dates);
  if (!str) { return null; }
  return `🎥 ${cTitle}${RN}${str}`;
};

const sessionToStr = (sessions: string[]): string => {
  let str: string = '';
  const sortItems = sortBy(sessions, (date) => new Date(date).getTime());
  const strItems = uniq(sortItems.map((date) => dateStrToTime(date)));
  for (const item of strItems) {
    str = str ? `${str}, \`${item}\`` : `\`${item}\``;
  }
  return `🕒 ${str}`;
};

const dateStrToTime = (val: string) => (
  moment(val).format('HH:mm')
);
