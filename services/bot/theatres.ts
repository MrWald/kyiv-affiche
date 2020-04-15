import { reduce, sortBy, uniq } from 'lodash';
import moment from 'moment';
import { Log, RN, RN2 } from 'utils';
import { ITheatre, IPerformance } from 'services/bot/types';
const mysql = require('serverless-mysql')({
  config: {
    host: "remotemysql.com",
    user: "7a9EKOagJL",
    password: "lIpVHtzmPM",
    port: 3306,
    database: "7a9EKOagJL"
  }
});
//import util from 'util';

const log = Log('theatres.theatres');

//const con = mysql.createConnection();

//const conn = util.promisify(con.connect).bind(con);
//const query = util.promisify(con.query).bind(con);

export const getTheatresData = async (): Promise<ITheatre[]> => {
  // try{
  //   await conn();
  // } catch(error){
  //   log.err(error);
  //   return null;
  // }
  log.debug('getting theatres data');
  let data = [];
  let temp;
  try {
    temp = await mysql.query("SELECT * FROM Theatres");
  } catch(error) {
    log.err(error);
    return null;
  }
  for (const theatre of temp) {
    data.push(
      {
        theatre_id: theatre.theatre_id,
        name: theatre.name,
        street: theatre.street,
        building: theatre.building,
        district: theatre.district,
        postal_code: theatre.postal_code,
        phone: theatre.phone,
        opening: theatre.opening,
        closing: theatre.closing,
        doc_link: theatre.doc_link,
        performances: await getPerformances(theatre.theatre_id),
        workers: await getWorkers(theatre.theatre_id)
      }
      );
  }
  log.debug('getting theatres data done');
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

// const getTitle = (title_id: number): string => {
//   let data;
//   con.query("SELECT 7a9EKOagJL.Titles.title_name FROM 7a9EKOagJL.Titles WHERE 7a9EKOagJL.Titles.title_id="+title_id+";", (err, res) => {
//     if(err)
//       throw err;
//     data = res;
//   });
//   return data;
// }

const getPhotos = async (n_performance: number): Promise<string[]> => {
  return await mysql.query("SELECT photo FROM Photogallery WHERE n_performance="+n_performance);
}

const getPerformances = async (theatre_id: number): Promise<IPerformance[]> => {
  let data = [];
  const temp = await mysql.query("SELECT * FROM Performances WHERE n_theatre="+theatre_id);
  for(const performance of temp){
    data.push({
      n_performance: performance.n_performance,
      genres: await getGenre(performance.n_performance),
      name: performance.name,
      actions: performance.actions,
      max_age: performance.max_age,
      language: performance.language,
      max_price: performance.max_price,
      min_price: performance.min_price,
      duration: performance.duration,
      based_on: performance.based_on,
      dates: await getDates(performance.n_performance),
      authors: await getAuthors(performance.n_performance),
      roles: await getRolesP(performance.n_performance),
      photos: await getPhotos(performance.n_performance)
    });
  }
  return data;
}

const getGenre = async (n_performance: number): Promise<string[]> => {
  return await mysql.query("SELECT name FROM Genres WHERE Genres.n_genre=(SELECT Performances.n_genre FROM Performances WHERE n_performance="+n_performance+")");
}

const getAuthors = async (n_performance: number): Promise<string[]> => {
  let data = [];
  const temp = await mysql.query("SELECT name, surname, patronymic FROM Workers WHERE worker_code IN (SELECT n_author FROM Authors_Performance WHERE n_performance="+n_performance+")");
  for(const author of temp)
      data.push(author.surname+" "+author.name+" "+author.patronymic);
  return data;
}

const getDates = async (n_performance: number): Promise<string[]> => {
  return await mysql.query("SELECT performance_start FROM Date_Time_Performance WHERE n_performance="+n_performance);
}

// const getAwards = (worker_code: number): string[] => {
//   let data;
//   con.query("SELECT 7a9EKOagJL.Awards.name FROM 7a9EKOagJL.Awards WHERE 7a9EKOagJL.Awards.worker_n="+worker_code+";", (err, res) => {
//     if(err)
//       throw err;
//     data = res;
//   });
//   return data;
// }

const getRolesP = async (n_performance: number): Promise<string[]> => {
  return await mysql.query("SELECT name FROM Roles WHERE n_performance="+n_performance);
}

// const getCreations = (worker_code: number): string[] => {
//   let data;
//   con.query("SELECT 7a9EKOagJL.Performances.name FROM 7a9EKOagJL.Performances WHERE 7a9EKOagJL.Performances.n_performance IN (SELECT 7a9EKOagJL.Authors_Performance.n_performance FROM 7a9EKOagJL.Authors_Performance WHERE 7a9EKOagJL.Authors_Performance.n_author="+worker_code+");", (err, res) => {
//     if(err)
//       throw err;
//     data = res;
//   });
//   return data;
// }

const getWorkers = async (theatre_id: number): Promise<string[]> => {
  let data = [];
  const res = await mysql.query("SELECT name, surname, patronymic FROM Workers WHERE theatre_id=" + theatre_id);
  for(const worker of res)
    data.push(worker.name+" "+worker.surname+" "+worker.patronymic);
  return data;
}