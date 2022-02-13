import { useEffect } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
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

interface Navegate {
  slug: string;
  title: string;
}
interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  prev_post: Navegate | null;
  next_post: Navegate | null;
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
  preview: boolean;
}

export default function Post(props: PostProps): JSX.Element {
  const { post, preview } = props;
  const router = useRouter();

  const readTime = post?.data.content.reduce((timeToRead, deepContent) => {
    const bodyText = PrismicDOM.RichText.asText(deepContent.body);
    const wordQtd = bodyText.match(/(\w+)/g).length;
    const newTimeToRead = Math.ceil(wordQtd / 200);

    return timeToRead + newTimeToRead;
  }, 0);

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');

    if (!router.isFallback && anchor) {
      if (anchor.childNodes[0]) {
        anchor.removeChild(anchor.childNodes[0]);
      }

      script.setAttribute('src', 'https://utteranc.es/client.js');
      script.setAttribute('crossorigin', 'anonymous');
      script.setAttribute('async', 'true');
      script.setAttribute(
        'repo',
        'RafaelLSilveira/desafio05-trilha-reactjs-comments'
      );
      script.setAttribute('issue-term', 'pathname');
      script.setAttribute('theme', 'github-dark');

      anchor.appendChild(script);
    }
  }, [router]);

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
          {post?.last_publication_date ? (
            <p className={styles.lastPublication}>
              * editado em
              {format(new Date(post?.last_publication_date), ' PPPp', {
                locale: ptBR,
              })}
            </p>
          ) : null}

          {post?.data.content.map(({ body, heading }) => (
            <div key={uuid()} className={styles.paragraphBlock}>
              <strong className={commonStyles.title}>{heading}</strong>
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

          <hr className={styles.horizontalRow} />

          <div
            className={styles.navegate}
            style={{
              justifyContent: post.prev_post ? 'space-between' : 'flex-end',
            }}
          >
            {post.prev_post && (
              <Link href={`/post/${post.prev_post.slug}`}>
                <a className={styles.navegateAnchor}>
                  <p className={styles.navegateTitle}>{post.prev_post.title}</p>
                  <p>Post anterior</p>
                </a>
              </Link>
            )}
            {post.next_post && (
              <Link href={`/post/${post.next_post.slug}`}>
                <a className={styles.navegateAnchor}>
                  <p className={styles.navegateTitle}>{post.next_post.title}</p>
                  <p>Próximo post</p>
                </a>
              </Link>
            )}
          </div>

          <div id="inject-comments-for-uterances" />
        </div>
      </main>
      {preview && (
        <aside className={commonStyles.previewMode}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
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

export const getStaticProps: GetStaticProps<PostProps> = async ({
  preview = false,
  previewData,
  params,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title'],
      pageSize: 1,
      after: String(response?.id),
      orderings: '[document.first_publication_date desc]',
    }
  );

  const nextResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title'],
      pageSize: 1,
      after: String(response?.id),
      orderings: '[document.first_publication_date]',
    }
  );

  if (response === null) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const prev_post =
    prevResponse.results.length > 0
      ? {
          title: prevResponse.results[0]?.data.title,
          slug: prevResponse.results[0]?.uid,
        }
      : null;

  const next_post =
    nextResponse.results.length > 0
      ? {
          title: nextResponse.results[0]?.data.title,
          slug: nextResponse.results[0]?.uid,
        }
      : null;

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    prev_post,
    next_post,
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
      preview,
    },
  };
};
