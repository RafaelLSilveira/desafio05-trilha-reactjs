import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import PrismicDOM, { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  FaCalendar as CalendarIcon,
  FaUser as UserIcon,
  FaClock as ClockIcon,
} from 'react-icons/fa';
import uuid from 'uuid/dist/v4';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post(props: PostProps): JSX.Element {
  const { post } = props;

  const readTime = post?.data.content.reduce((timeToRead, deepContent) => {
    const bodyText = PrismicDOM.RichText.asText(deepContent.body);
    const wordQtd = bodyText.match(/(\w+)/g).length;
    const newTimeToRead = Math.ceil(wordQtd / 200);

    return timeToRead + newTimeToRead;
  }, 0);

  const router = useRouter();
  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Post | {post?.data.title}</title>
        </Head>
        <Header />
        <main className={commonStyles.container}>
          <p>Carregando...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Post | {post?.data.title}</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        <img
          src={post?.data.banner.url}
          className={styles.banner}
          alt="banner"
        />
        <div className={commonStyles.posts}>
          <p className={styles.title}> {post?.data.title}</p>

          <div className={commonStyles.postInfo}>
            <time>
              <CalendarIcon className={commonStyles.icon} />
              {format(new Date(post?.first_publication_date), 'd MMM y', {
                locale: ptBR,
              })}
            </time>
            <p>
              <UserIcon className={commonStyles.icon} />
              {post?.data.author}
            </p>
            <p>
              <ClockIcon className={commonStyles.icon} />
              {readTime} min
            </p>
          </div>

          {post?.data.content.map(({ body, heading }) => (
            <div key={uuid()} className={styles.paragraphBlock}>
              <strong>{heading}</strong>
              <br />
              <br />
              <div
                className={styles.body}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(body),
                }}
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [
      Prismic.predicates.at('document.type', 'posts'),
      Prismic.predicates.at('my.posts.uid', 'artigo-1'),
    ],
    { lang: '*' }
  );

  const postPaths = posts.results.map(post => {
    return { params: { slug: String(post.uid) } };
  });

  return {
    paths: [...postPaths],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  if (response === null) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post = {
    uid: response.uid,
    first_publication_date: response?.first_publication_date,
    data: {
      author: response.data.author,
      title: response.data.title,
      subtitle: response.data.subtitle,
      content: response.data.content,
      banner: {
        url: response.data.banner.url,
      },
    },
  };

  return {
    props: {
      post,
    },
  };
};
