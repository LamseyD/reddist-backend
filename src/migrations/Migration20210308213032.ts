import { Migration } from '@mikro-orm/migrations';

export class Migration20210308213032 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `user` add `email` varchar(255) not null;');
    this.addSql('alter table `user` add unique `user_email_unique`(`email`);');

    // this.addSql('alter table `user` add unique `user_email_unique`(`email`);');
  }

}
