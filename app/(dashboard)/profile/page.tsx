"use client"

import { useState } from "react"
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  FolderOpen,
  Plus,
  Trash2,
  Save,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProgressGauge } from "@/components/progress-gauge"
import { cn } from "@/lib/utils"

interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startYear: string
  endYear: string
}

interface Experience {
  id: string
  company: string
  title: string
  location: string
  startDate: string
  endDate: string
  description: string
}

interface Project {
  id: string
  name: string
  description: string
  url: string
  technologies: string
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("personal")
  
  // Personal Info State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1 (555) 000-0000",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/johndoe",
    summary: "Experienced software engineer with a passion for building scalable applications and leading high-performing teams."
  })

  // Education State
  const [education, setEducation] = useState<Education[]>([
    {
      id: "1",
      institution: "Stanford University",
      degree: "Master of Science",
      field: "Computer Science",
      startYear: "2018",
      endYear: "2020"
    }
  ])

  // Experience State
  const [experience, setExperience] = useState<Experience[]>([
    {
      id: "1",
      company: "Tech Corp",
      title: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2020",
      endDate: "Present",
      description: "Led development of microservices architecture serving 1M+ users."
    }
  ])

  // Projects State
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "AI Dashboard",
      description: "Real-time analytics dashboard built with React and D3.js",
      url: "github.com/johndoe/ai-dashboard",
      technologies: "React, TypeScript, D3.js, TailwindCSS"
    }
  ])

  const addEducation = () => {
    setEducation([...education, {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      field: "",
      startYear: "",
      endYear: ""
    }])
  }

  const removeEducation = (id: string) => {
    setEducation(education.filter(e => e.id !== id))
  }

  const addExperience = () => {
    setExperience([...experience, {
      id: Date.now().toString(),
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      description: ""
    }])
  }

  const removeExperience = (id: string) => {
    setExperience(experience.filter(e => e.id !== id))
  }

  const addProject = () => {
    setProjects([...projects, {
      id: Date.now().toString(),
      name: "",
      description: "",
      url: "",
      technologies: ""
    }])
  }

  const removeProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
  }

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: FolderOpen },
  ]

  return (
    <div className="space-y-6 pt-16 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Profile Setup
          </h1>
          <p className="mt-1 text-muted-foreground">
            Complete your profile to generate better cover letters
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ProgressGauge 
            value={65} 
            max={100} 
            size={80}
            strokeWidth={8}
            label="Complete"
          />
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Personal Information</CardTitle>
              <CardDescription>Your basic contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 ring-4 ring-muted">
                  <AvatarImage src="/avatar.jpg" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl text-primary-foreground">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">Change Photo</Button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                  <Input
                    id="firstName"
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                  <Input
                    id="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground">Location</Label>
                  <Input
                    id="location"
                    value={personalInfo.location}
                    onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-foreground">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={personalInfo.linkedin}
                    onChange={(e) => setPersonalInfo({...personalInfo, linkedin: e.target.value})}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary" className="text-foreground">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={personalInfo.summary}
                  onChange={(e) => setPersonalInfo({...personalInfo, summary: e.target.value})}
                  className="min-h-[100px] resize-none bg-background"
                  placeholder="Write a brief summary of your professional background..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education" className="space-y-4">
          {education.map((edu, index) => (
            <Card key={edu.id} className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">
                  Education {index + 1}
                </CardTitle>
                {education.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEducation(edu.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-foreground">Institution</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = education.map(item => 
                          item.id === edu.id ? {...item, institution: e.target.value} : item
                        )
                        setEducation(updated)
                      }}
                      placeholder="e.g., Stanford University"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Degree</Label>
                    <Input
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = education.map(item => 
                          item.id === edu.id ? {...item, degree: e.target.value} : item
                        )
                        setEducation(updated)
                      }}
                      placeholder="e.g., Master of Science"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Field of Study</Label>
                    <Input
                      value={edu.field}
                      onChange={(e) => {
                        const updated = education.map(item => 
                          item.id === edu.id ? {...item, field: e.target.value} : item
                        )
                        setEducation(updated)
                      }}
                      placeholder="e.g., Computer Science"
                      className="bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-foreground">Start Year</Label>
                      <Input
                        value={edu.startYear}
                        onChange={(e) => {
                          const updated = education.map(item => 
                            item.id === edu.id ? {...item, startYear: e.target.value} : item
                          )
                          setEducation(updated)
                        }}
                        placeholder="2018"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">End Year</Label>
                      <Input
                        value={edu.endYear}
                        onChange={(e) => {
                          const updated = education.map(item => 
                            item.id === edu.id ? {...item, endYear: e.target.value} : item
                          )
                          setEducation(updated)
                        }}
                        placeholder="2020"
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            onClick={addEducation}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add Education
          </Button>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-4">
          {experience.map((exp, index) => (
            <Card key={exp.id} className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg text-foreground">
                  Experience {index + 1}
                </CardTitle>
                {experience.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExperience(exp.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-foreground">Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => {
                        const updated = experience.map(item => 
                          item.id === exp.id ? {...item, company: e.target.value} : item
                        )
                        setExperience(updated)
                      }}
                      placeholder="e.g., Google"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Job Title</Label>
                    <Input
                      value={exp.title}
                      onChange={(e) => {
                        const updated = experience.map(item => 
                          item.id === exp.id ? {...item, title: e.target.value} : item
                        )
                        setExperience(updated)
                      }}
                      placeholder="e.g., Senior Software Engineer"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Location</Label>
                    <Input
                      value={exp.location}
                      onChange={(e) => {
                        const updated = experience.map(item => 
                          item.id === exp.id ? {...item, location: e.target.value} : item
                        )
                        setExperience(updated)
                      }}
                      placeholder="e.g., San Francisco, CA"
                      className="bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-foreground">Start Date</Label>
                      <Input
                        value={exp.startDate}
                        onChange={(e) => {
                          const updated = experience.map(item => 
                            item.id === exp.id ? {...item, startDate: e.target.value} : item
                          )
                          setExperience(updated)
                        }}
                        placeholder="2020"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">End Date</Label>
                      <Input
                        value={exp.endDate}
                        onChange={(e) => {
                          const updated = experience.map(item => 
                            item.id === exp.id ? {...item, endDate: e.target.value} : item
                          )
                          setExperience(updated)
                        }}
                        placeholder="Present"
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => {
                      const updated = experience.map(item => 
                        item.id === exp.id ? {...item, description: e.target.value} : item
                      )
                      setExperience(updated)
                    }}
                    placeholder="Describe your key responsibilities and achievements..."
                    className="min-h-[80px] resize-none bg-background"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            onClick={addExperience}
            className="w-full gap-2 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.id} className="group border-border bg-card shadow-sm transition-all hover:border-primary/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                      <FolderOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProject(project.id)}
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Input
                      value={project.name}
                      onChange={(e) => {
                        const updated = projects.map(item => 
                          item.id === project.id ? {...item, name: e.target.value} : item
                        )
                        setProjects(updated)
                      }}
                      placeholder="Project Name"
                      className="bg-background font-medium"
                    />
                    <Textarea
                      value={project.description}
                      onChange={(e) => {
                        const updated = projects.map(item => 
                          item.id === project.id ? {...item, description: e.target.value} : item
                        )
                        setProjects(updated)
                      }}
                      placeholder="Brief description..."
                      className="min-h-[60px] resize-none bg-background text-sm"
                    />
                    <Input
                      value={project.technologies}
                      onChange={(e) => {
                        const updated = projects.map(item => 
                          item.id === project.id ? {...item, technologies: e.target.value} : item
                        )
                        setProjects(updated)
                      }}
                      placeholder="Technologies used..."
                      className="bg-background text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={project.url}
                        onChange={(e) => {
                          const updated = projects.map(item => 
                            item.id === project.id ? {...item, url: e.target.value} : item
                          )
                          setProjects(updated)
                        }}
                        placeholder="Project URL"
                        className="bg-background text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card 
              onClick={addProject}
              className="flex min-h-[280px] cursor-pointer items-center justify-center border-dashed border-border bg-card/50 transition-all hover:border-primary/50 hover:bg-card"
            >
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 font-medium text-foreground">Add Project</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Showcase your work
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
