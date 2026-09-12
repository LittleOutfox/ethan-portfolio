export interface Link {
  label: string
  href: string
  external?: boolean
}

export interface Profile {
  name: string
  /** the one line under the name */
  role: string
  /** the positioning sentence, verbatim from the bio */
  standfirst: string
  school: string
  status: string
  /** employers, as named in the experience ledger */
  experienceLine: string
  /** the lead project, as named in the projects section */
  built: string
  based: string
  focus: string
  email: string
  /** bio paragraphs in reading order */
  bio: string[]
}

export interface ExperienceEntry {
  year: string
  organization: string
  role: string
  projected?: boolean
}

export interface Project {
  id: string
  title: string
  meta: string
  description: string
  /** measured facts only, set in the data role */
  specs?: string[]
  stack: string
  link?: Link
  /** shown when there is no public source */
  note?: string
}

export interface Skill {
  name: string
  line: string
  note?: string
}

export interface Hobby {
  name: string
  description: string
}
