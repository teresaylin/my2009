# script to create teams json
# to load:

import csv

input_file = "teams.csv"
output_file = "teams.json"

template = """  {
    "pk": %(pk)s,
    "model": "users.team",
    "fields": {
      "name": "%(name)s",
      "color": "%(color)s",
      "course": "%(course)s",
      "team_email": "%(team_email)s"
    }
  },
"""

def create_json():
    f_in = open(input_file,"rb")
    f_out = open(output_file,"w")
    print >>f_out, "["

    reader = csv.reader(f_in)
    header = reader.next()
    for record in reader:
        (pk, name, color, course, team_email) = record
        print >>f_out, template % ({'pk':pk,
                                    'name':name,
                                    'color':color,
                                    'course':course,
                                    'team_email':team_email
                                    })
    print >>f_out, "]"
    f_out.close()
    f_in.close()
    print 'REMINDER: Delete comma after last element before using!'

if __name__ == '__main__':
    create_json()


