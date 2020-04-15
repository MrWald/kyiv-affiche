import { reduce, sortBy, uniq } from 'lodash';
import moment from 'moment';
import { Log, RN, RN2 } from 'utils';
import { ITheatre, IPerformance } from 'services/bot/types';
import mysql from 'mysql';

const log = Log('theatres.theatres');

const con = mysql.createConnection({
  host: "remotemysql.com",
  user: "7a9EKOagJL",
  password: "lIpVHtzmPM",
  port: 3306
});

con.connect((err) => {
  if (err) 
    log.err(err);
  else 
    log.debug("Connected!");
});

export const getTheatresData = async (): Promise<ITheatre[]> => {
  log.debug('getting theatres data');
  let data = [];
  let temp;
  await con.query("SELECT * FROM 7a9EKOagJL.Theatres;", (err, res) => {
    if(err)
      throw err;
    temp = res;
  });
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
      });
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
  let data;
  await con.query("SELECT 7a9EKOagJL.Photogallery.photo FROM 7a9EKOagJL.Photogallery WHERE 7a9EKOagJL.Photogallery.n_performance="+n_performance+";", (err, res) => {
    if(err)
      throw err;
    data = res;
  });
  return data;
}

const getPerformances = async (theatre_id: number): Promise<IPerformance[]> => {
  let data = [];
  await con.query("SELECT * FROM 7a9EKOagJL.Performances WHERE 7a9EKOagJL.Performances.n_theatre="+theatre_id+";", (err, res) => {
    if(err)
      throw err;
    for(const performance of res){
      data.push({
        n_performance: performance.n_performance,
        genres: getGenre(performance.n_performance),
        name: performance.name,
        actions: performance.actions,
        max_age: performance.max_age,
        language: performance.language,
        max_price: performance.max_price,
        min_price: performance.min_price,
        duration: performance.duration,
        based_on: performance.based_on,
        dates: getDates(performance.n_performance),
        authors: getAuthors(performance.n_performance),
        roles: getRolesP(performance.n_performance),
        photos: getPhotos(performance.n_performance)
      });
    }
  });
  return data;
}

const getGenre = async (n_performance: number): Promise<string[]> => {
  let data;
  await con.query("SELECT 7a9EKOagJL.Genres.name FROM 7a9EKOagJL.Genres WHERE 7a9EKOagJL.Genres.n_genre=(SELECT 7a9EKOagJL.Performances.n_genre FROM 7a9EKOagJL.Performances WHERE 7a9EKOagJL.Performances.n_performance="+n_performance+");", (err, res) => {
    if(err)
      throw err;
    data = res;
  });
  return data;
}

const getAuthors = async (n_performance: number): Promise<string[]> => {
  let data = [];
  con.query("SELECT 7a9EKOagJL.Workers.name, 7a9EKOagJL.Workers.surname, 7a9EKOagJL.Workers.patronymic FROM 7a9EKOagJL.Workers WHERE 7a9EKOagJL.Genres.worker_code IN (SELECT 7a9EKOagJL.Authors_Performance.n_author FROM 7a9EKOagJL.Authors_Performance WHERE 7a9EKOagJL.Authors_Performance.n_performance="+n_performance+");", (err, res) => {
    if(err)
      throw err;
    for(const author of res)
      data.push(author.surname+" "+author.name+" "+author.patronymic);
  });
  return data;
}

const getDates = async (n_performance: number): Promise<string[]> => {
  let data;
  await con.query("SELECT 7a9EKOagJL.Date_Time_Performance.performance_start FROM 7a9EKOagJL.Date_Time_Performance WHERE 7a9EKOagJL.Date_Time_Performance.n_performance="+n_performance+";", (err, res) => {
    if(err)
      throw err;
    data = res;
  });
  return data;
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
  let data;
  await con.query("SELECT 7a9EKOagJL.Roles.name FROM 7a9EKOagJL.Roles WHERE 7a9EKOagJL.Roles.n_performance="+n_performance+";", (err, res) => {
    if(err)
      throw err;
    data = res;
  });
  return data;
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
  let data;
  await con.query("SELECT 7a9EKOagJL.Workers.name, 7a9EKOagJL.Workers.surname, 7a9EKOagJL.Workers.patronymic FROM 7a9EKOagJL.Workers WHERE 7a9EKOagJL.Workers.theatre_id=" + theatre_id+";", (err, res) => {
    if(err)
      throw err;
    data.push(res[1]+" "+res[0]+" "+res[2]);
  });
  return data;
}