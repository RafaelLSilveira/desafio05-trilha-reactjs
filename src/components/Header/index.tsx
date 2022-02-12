import Link from 'next/link';
import Image from 'next/image';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <div className={styles.header}>
      <Link href="/">
        <Image src="/logo.svg" width={238.62} height={25.63} alt="logo" />
        {/* <img src="/logo.svg" alt="logo" /> */}
      </Link>
    </div>
  );
}
