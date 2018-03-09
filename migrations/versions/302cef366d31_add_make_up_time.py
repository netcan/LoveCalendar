"""add make up time

Revision ID: 302cef366d31
Revises: 5afd72b84a5a
Create Date: 2018-03-09 09:09:21.812202

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '302cef366d31'
down_revision = '5afd72b84a5a'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('note', sa.Column('make_up_time', sa.DateTime(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('note', 'make_up_time')
    # ### end Alembic commands ###